var loader = require('./loader'),
  q = require('q'),
  _ = require('lodash'),
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

          var bootstrapResult = _.isFunction(module.bootstrap) ?
          module.bootstrap.call(module) :
          (_.isFunction(module.bootstrap.function) && module.bootstrap.function.call(module))

        q.isPromise( bootstrapResult ) ? bootstrapResult.then(function(){next()}).fail(next) : next()

      }, function( err ){
        console.log("================callback, ",err)
        if(err) return ZERO.error(err)
        cb()
      })

  })
}