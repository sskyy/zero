var loader = require('./loader'),
  _ = require('lodash'),
  util = require('./util'),
  linkedList = require('./linkedList'),
  winston = require('winston'),
  logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ level: 'debug' }),
    ]})

module.exports = function ( opt, cb) {

  return loader.loadAll( opt, function (err, modules) {
    if( err ){
      logger.error("load modules error, due to", err)
      return cb(err)
    }

    opt.app.modules = modules
    var bootstraps = new linkedList

    //console.log( "modules ====>",Object.keys(modules).length)
    _.forEach( modules, function (module) {
      if (module.bootstrap) {
        bootstraps.push(module, module.name + ".bootstrap", module.bootstrap.order || false)
      }
    })

    bootstraps.forEachSeries(function (module, next) {
      logger.info("bootstrap ::", module.name)
      //when every module is initialized, call their bootstrap function

      try {
        var bootstrapResult = _.isFunction(module.bootstrap) ?
          module.bootstrap.call(module, opt.app, opt.server) :
          (_.isFunction(module.bootstrap.function) && module.bootstrap.function.call(module, opt.app, opt.server))


        util.isPromiseAlike(bootstrapResult) ? bootstrapResult.then(function () { next() }) : next()

      } catch (e) {
        logger.error("bootstrap error happened in module", module.name)
        console.trace(e)
      }

    }, function( err ){
      cb(err, modules)
    })

  })
}