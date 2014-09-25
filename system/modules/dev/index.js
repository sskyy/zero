var q = require('q'),
  path = require('path'),
  _ = require('lodash')

function duplicate(str, num) {
  return (new Array(num + 1)).join(str)
}

function cleanCircular(object, preCached) {
  preCached = preCached || {}
  var cached = _.values(preCached),
    cachedNamespace = _.keys(preCached)

    ;
  (function _cleanCircular(obj, namespace) {
    _.forEach(obj, function (v, k) {
      if (!obj.hasOwnProperty(k)) return
      var i = cached.indexOf(v)

      if (v === obj) {
        obj[k] = "{circular reference of root object}"
      } else if (i !== -1) {
        obj[k] = "{circular reference of " + cachedNamespace[i] + "}"
      } else {
        if (_.isArray(v) || _.isObject(v)) {
          cached.push(v)
          namespace.push(k)
          cachedNamespace.push(namespace.join('.'))
          _cleanCircular(v, namespace)
        }
      }
    })
  }(object, []))

  return object
}

module.exports = {
  deps: ['statics', 'request'],
  route: {
    "/dev/simulate": {
      "function": function (req, res) {

        var url = req.body.url,
          method = req.body.method,
          data = req.body.data

        req.body = data

        req.bus.fire('request.mock', {url: url, method: method, req: req, res: res})

        //all done
        console.log(req.bus['$$results'])
        req.bus.then(function () {
          ZERO.mlog('dev', 'mock', url, 'done')
          try {
            res.json(cleanCircular(req.bus.$$traceRoot))
          } catch (e) {
            res.status(500).end()
          }
        })
      },
      order: {before: "respond.respondHandler"}
    }
  },
  statics: {
    "/dev": path.join(__dirname, './public')
  }
}
