var loader = require('./loader'),
  q = require('q'),
  _ = require('lodash')

module.exports = function( app, opt, cb ){

  return loader.loadAll.call(app, opt, function(){
    try{
      var strap = _.reduce(app.modules,function(a, b){

        ZERO.mlog("bootstrap", b.name)
        //when every module is initialized, call their bootstrap function
        var bootstrapResult = _.isFunction(b.bootstrap) ? b.bootstrap.call(b) : []

        return a.concat( bootstrapResult )
      },[])
    }catch(e){
      ZERO.error("bootstrap error",e)
    }


    q.all( strap )
      .then(cb)
      .fail( function(err){
      ZERO.error( err)
    })
  })
}