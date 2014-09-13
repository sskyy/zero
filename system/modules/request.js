var _ = require('lodash'),
  q = require('q'),
  orderedCollection = require('../core/orderedCollection')

function standardRoute(url) {
  var result = { url: null, method: null}

  if (/\S+\s+\/\w+/.test(url)) {
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
    req.bus.session = req.bus.session || req.session



    if( fnForEachReq ){

      console.log("fnForEachReq", fnForEachReq, callback, bus)
      fnForEachReq( req )
    }

    if (_.isFunction(callback)) {

      callback(req, res, next)

    } else if (_.isString(callback)) {

      console.log("firing ", callback, _.merge(req.params, req.body, req.query), req.route)
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
        console.log(err)
        next( err)
      })
    }
  }

}


module.exports = {
  deps: ['bus'],
  responds: [],
  routes : new orderedCollection,
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
      console.log("[request expand]", module.name, url, handler.name)
    })
  },
  bootstrap: function () {
    //read respond
    var root = this

    root.routes.forEach(function ( route ) {
      APP.route(route.url)[route.method](route.handler.function)
    })
  },
  //api
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
    console.log("[adding route]", route.url, route.method )
  },
  getRouteHandlers : function( url, method ){
    var root = this,
      matchedParams,
      handlers = []

    root.routes.forEach( function( route ){
      if( method && route.method !== 'all' && method !== route.method ) return

      matchedParams = root.matchUrl( url, route.url)
      if( matchedParams ){
        handlers.push(_.extend({}, route.handler, {params:matchedParams}))
      }
    })

    return handlers
  },
  triggerRequest : function( url, method, req, res ){
    console.log("[request] trigger request", url, method)

    var root = this,
      handlers = root.getRouteHandlers(url, method),
      reqAgent = _.clone(req)


    triggerHandler(0)

    function triggerHandler(i){
      if( !handlers[i]) return

      reqAgent.params = _.isObject( handlers[i].params ) ? handlers[i].params : {}
      handlers[i].function( req,res, _.partial(triggerHandler,++i))
    }
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

    console.log("MATCHING===URL:", url, "WILDCARD:",wildcard, "REX:",rex ,matches&&_.zipObject( keys, matches.slice(1)))

    return matches ? _.zipObject( keys, matches.slice(1) ) : false

  }
}