var _ = require('lodash'),
  q = require('q')

function standardRoute(url) {
  var result = { url: null, method: null}


  if (/\S+\s+\S+/.test(url)) {
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
      q.allSettled(_.values(params)).then(function () {
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
  routes : [],
  expand: function (module) {
    var root = this
    //read route from data
    console.log("[request expand]", module.name, module.route, module.status)
    _.forEach( module.route, function( handler, url ){
      root.add( handler, url)
    })
  },
  bootstrap: function () {
    //read respond
    var root = this

    root.responds.forEach(function (respond) {
      _.mapValues(respond, root.add.bind(root))
    })

  },
  //api
  add: function (callback, url, fnForEachReq) {
    var root = this,
      route = standardRoute(url)

    route.callback = standardCallback(callback, root.dep.bus.bus, fnForEachReq)

    //save it! other module may need
    root.routes.push( route )
    console.log("[adding route]", route.url, route.method )
    root.app.route(route.url)[route.method](route.callback)
  },
  getRouteHandler : function( url, method ){
    var root = this,
      matchedParams,i


    for( i in root.routes){

      //1. check method
      if( method && root.routes[i].method !== 'all' && method !== root.routes[i].method ) return false

      //2. check url
      matchedParams = root.matchUrl( url, root.routes[i].url)
      if(  matchedParams ) break
    }

    return matchedParams ? _.extend({},root.routes[i],{params:matchedParams}) : false
  },
  triggerRequest : function( url, method, req, res, next ){
    var root = this,
      handler = root.getRouteHandler(url, method),
      reqAgent = _.clone(req)

    //fix params
    reqAgent.params =  handler.params

    //TODO fix path,baseURL, etc.
    console.log("REQAGENT", reqAgent.params, reqAgent.body, reqAgent.query)
    handler.callback( reqAgent, res, next )
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