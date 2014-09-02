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
    //This is important!!!
    req.bus = bus.fork()
    req.bus.start()

    if( fnForEachReq ){
      fnForEachReq( req )
    }

    if (_.isFunction(callback)) {

      callback(req, res, next)

    } else if (_.isString(callback)) {

      console.log("firing ", callback, _.merge(req.params, req.body, req.query), req.route)
      bus.fire(callback, _.merge(req.params, req.body, req.query))
      //important!
      req.bus = bus
      next()

    } else if (_.isObject(callback)) {

      //support object structure : {params:{/*map functions*/},event:/*event to be fire*/}
      var params = _.defaults(_.map(callback.param, function (name, paramMapFn) {
        return paramMapFn(req.params[name], req)
      }), req.params)

      q.allSettled(_.values(params)).then(function () {
        bus.fire(callback.event, _.map(params, function (param) {
          return q.isPromise(param) ? param.value : param
        }))

        next()
      }).fail(function (err) {
        console.log(err)
      })
    }
  }

}

module.exports = {
  dependencies: ['bus'],
  responds: [],
  init: function (bus) {
    console.log("[request init]")
    this.bus = bus.bus
  },
  expand: function (module) {

    //read route from data
    console.log("[request expand]", module.name, module.route, module.status)
    _.mapValues(module.route, this.add.bind(this))

    //respond route must be match in the last
    this.responds.push(module.respond)
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
      route = standardRoute(url),
      callback = standardCallback(callback, root.bus, fnForEachReq)

    console.log("[adding route]", route.url, route.method)
    root.app.route(route.url)[route.method](callback)
  }
}