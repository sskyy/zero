var loader = require('./loader'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  util = require('./util'),
  orderedCollection = require('./orderedCollection')

module.exports = function( app, opt, cb ){

  return loader.loadAll.call(app, opt, function(){
    var bootstraps = new orderedCollection

    _.forEach(app.modules,function(module){

      if( module.bootstrap ){
        bootstraps.push( module, module.name+".bootstrap", module.bootstrap.order || false )
      }
    })

      bootstraps.forEachSeries(function( module, next ){

        ZERO.mlog("bootstrap", module.name)
        //when every module is initialized, call their bootstrap function

        try{
          var bootstrapResult = _.isFunction(module.bootstrap) ?
            module.bootstrap.call(module) :
            (_.isFunction(module.bootstrap.function) && module.bootstrap.function.call(module))


          util.isPromiseAlike( bootstrapResult ) ? bootstrapResult.then(function(){next()}) : next()

        }catch(e){
          ZERO.error("bootstrap error happened in module", module.name)
          console.trace(e)
        }

      }, cb)

  })
}