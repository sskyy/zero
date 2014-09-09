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
  getRouteCallback : function( url, method ){
    var root = this

    var matchRouteIndex = _.findIndex(root.routes, function( route){

      //1. check method
      if( method && route.method !== 'all' && method !== route.method ) return false

      //2. check url
      return root.matchUrl( url, route.url)
    })

    return matchRouteIndex == -1 ? false : this.routes[matchRouteIndex].callback
  },
  matchUrl : function( url, wildcard ){
    if( url == wildcard ) return true

    var rex = wildcard.replace("*","(.*)").replace(/(^|\/):\w+(\/|$)/g, "$1([\\\\w_-]+)$2").replace(/\//g,"\\/")

    return (new RegExt(rex) ).test(url)
  }
}