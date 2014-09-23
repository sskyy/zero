var _ = require('lodash'),
  q = require('q'),
  orderedCollection = require('../core/orderedCollection')

function standardRoute(url) {
  var result = { url: null, method: null}

  if (/^(GET|POST|DELETE|PUT)\s+(\/[\w\*]+|\*)/.test(url)) {
    var urlArray = url.split(/\s+/)
    result.method = urlArray[0].toLowerCase()
    result.url = urlArray[1]

  } else {
    result.method = 'all'
    result.url = url
  }

  return result
}

function standardCallback(callback, bus, fnForEachReq) {

  return function (req, res, next) {
    //This is important!!! we attach forked bus to every request, so we can use bus to
    req.bus = req.bus || bus.fork()
    req.bus._started || req.bus.start()
    req.bus.session = function(name, data){
      if( !data ) return req.session[name]
      return req.session[name] = data
    }


    if( fnForEachReq ){
      fnForEachReq( req )
    }

    if (_.isFunction(callback)) {

      callback(req, res, next)

    } else if (_.isString(callback)) {

      ZERO.mlog("request","firing ", callback, _.merge(req.params, req.body, req.query), req.route)
      req.bus.fire(callback, _.merge(req.params, req.body, req.query))
      //important!
      next()

    } else if (_.isObject(callback)) {

      //support object structure : {params:{/*map functions*/},event:/*event to be fire*/}
      var params = _.defaults(_.map(callback.param, function (name, paramMapFn) {
        return paramMapFn(req.params[name], req)
      }), req.params)

      //resolve all params first
      q.all(_.values(params)).then(function () {
        req.bus.fire(callback.event, _.mapValues(params, function (param) {
          return q.isPromise(param) ? param.value : param
        }))
        next()
      }).fail(function (err) {
        ZERO.error(err)
        next( err)
      })
    }
  }

}

/**
 * 该模块可以让其他模块能使用增强后的 express 的路由功能。
 * @module request
 */
var request = {
  deps: ['bus'],
  responds: [],
  routes : new orderedCollection,
  /**
   * 扩展依赖request的模块。为其提供增强后的 express 的 route 功能。
   * @param {object} module 被扩展的模块，将读取该模块的 `route` 属性。该属性必须是一个对象，键名为要处理的 url，键值为路由处理函数。
   */
  expand: function (module) {
    var root = this
    //read route from data
    _.forEach( module.route, function( handler, url ){
      if(_.isFunction( handler)){
        handler = {"function":handler, module:module.name}
      }else if(_.isObject(handler)&&!handler.module){
        handler.module = module.name
      }
      handler.name = handler.module+(handler.function.name ? "." + handler.function.name : '')
      root.add( url, handler)
      ZERO.mlog("request", "expanding", module.name, url, handler.name)
    })
  },
  bootstrap: function () {
    //read respond
    var root = this

    root.routes.forEach(function ( route ) {
      ZERO.mlog("request","attaching route", route.url, route.method, route.handler.name)
      APP.route(route.url)[route.method](route.handler.function)
    })
  },
  listen : {
    'request.mock' : function mockRequest( route ){
      var reqAgent = _.clone(route.req),
        resAgent = _.clone(route.res),
        bus = this,
        snapshot = bus.snapshot()

      reqAgent.path = route.url
      reqAgent.isFirstAgent = !route.req.isAgent
      reqAgent.isAgent = true
      reqAgent.bus = bus._origin.fork() //fork a new bus!!!
      reqAgent.__proto__ = route.req.__proto__

      resAgent.status = function(){return this}
      resAgent.send = _.noop
      resAgent.end = _.noop
      resAgent.json = _.noop
      resAgent.render = _.noop
      resAgent.isAgent = true
      resAgent.__proto__ = route.res.__proto__
      return request.triggerRequest( route.url, route.method, reqAgent, resAgent).then(function(){
        //merge $$traceStack back
        snapshot.$$traceRef.stack = reqAgent.bus.$$traceRoot.stack
        _.merge(snapshot.$$data, reqAgent.bus.$$data )
      }).fail(function(err){
      })
    }
  },
  //api
  /**
   * 添加一个对某一个 url 进行处理的路由函数，可以使用参数 order 来控制路由函数触发的顺序。用法见 orderedCollection 。
   * @param url {string} 支持 express route url 的所有写法，如 `/user/:id`。
   * @param handler {object|function} 使用object形式可以手动指定handler名称，如 {"function":function(){...},"name":"handlerName"}。
   * @param order {object} 例如 {first:true}/{last:true}。
   */
  add: function ( url, handler, order ) {
    var root = this,
      route = standardRoute(url)

    if(_.isFunction( handler)){
      handler = {"function":handler, module:module.name||root.relier,order:order}
    }else if(_.isObject(handler)){
      handler.module = handler.module || root.relier
      handler.order = handler.order || order
    }
    handler.name = handler.name || (handler.module+(handler.function.name ? ("." + handler.function.name) : '') )


    route.handler = handler
    handler.function = standardCallback( handler.function, root.dep.bus.bus )

    //save it! other module may need
    root.routes.push( route, route.handler.name,  route.handler.order  )
  },

  getRouteHandlers : function( url, method, routes){
    var root = this,
      matchedParams,
      handlers = []

    routes.forEach( function( route ){
      if( method && route.method !== 'all' && method !== route.method ) return

      matchedParams = root.matchUrl( url, route.url)
      if( matchedParams ){

        handlers.push(_.extend({}, route.handler, {params:matchedParams,matchedUrl:route.url}))
      }
    })

    return handlers
  },
  /**
   * 模拟请求某一 url 。
   * @param url {string}
   * @param method {string}
   * @param req {object} 传入原始的 req 对象。
   * @param res {object} 传入原始的 req 对象。
   */
  triggerRequest : function( url, method, reqAgent, resAgent ){
    ZERO.mlog("request","trigger request", url, method)

    var root = this,
      handlers = root.getRouteHandlers(url, method, root.routes)

    return q.Promise(function(resolve,reject){
      resAgent.status = function(){return resAgent}
      resAgent.send = resEnd
      resAgent.sendFile = resEnd
      resAgent.end = resEnd
      resAgent.json = resEnd
      resAgent.render = resEnd

      triggerHandler(0)

      function resEnd(){
        resolve()
      }

      function triggerHandler(i,err){
        if( err ){
          ZERO.error("trigger request err",err)
          return reject()
        }
        if( !handlers[i]){
          ZERO.mlog("request","trigger request",url,'done')
          return resolve()
        }

        reqAgent.params = _.isObject( handlers[i].params ) ? handlers[i].params : {}
        handlers[i].function( reqAgent,resAgent, _.partial(triggerHandler,++i))
      }
    })

  },
  matchUrl : function( url, wildcard ){
    if( url == wildcard ) return true

    var keys = _.reduce( wildcard.split("/"), function( a,b){
      var key
      if( b == "*" ){
        key = b
      }else if( /^:/.test(b) ){
        key = b.slice(1)
      }

      return a.concat( key?key:[] )
    },[])

    var rex = "^" + wildcard.replace("*","(.*)").replace(/(^|\/):\w+(\/|$)/g, "$1([\\w\\d_-]+)$2").replace(/\//g,"\\/") + "$"
    var matches = url.match( new RegExp(rex))


    return matches ? _.zipObject( keys, matches.slice(1) ) : false

  },
  standardRoute : standardRoute
}

module.exports = request