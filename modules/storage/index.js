var _ = require('lodash')
var fs = require('fs')
var path = require('path')

function requireDir( dir ){
    var fs = require('fs')
    var results = {}

  var sub = fs.readdirSync(path.join(__dirname,dir))
  _.forEach( sub, function( s){
    if( !/^\./.test(s)){
      results[s] = require( "./" + path.join( dir, s))
    }
  })

  return results
}



module.exports = {
  deps : ['bus','request'],
  drivers : requireDir('./drivers'),
  storage : {},
  listen : {},
  expand : function( module ){
    console.log( "drivers",this.drivers)
    var root = this
    if( module.models ){
      _.forEach( module.models, function( model){
        ZERO.mlog('storage', 'handle', model.identity,model.isFile && model.storage && root.drivers[model.storage])
        var storageInfo = {}

        if( model.isFile && model.storage  ){
          //find configuration for current model
          storageInfo = _.isString( model.storage)  ? _.extend({driver:model.storage},module.config.storage[model.storage]) : model.storage
          root.storage[model.identity] = _.extend(storageInfo,{model:model})
        }
      })
    }
  },
  bootstrap : function(){
    var root =this
    _.forEach( root.storage, function( storageInfo ){
      //this may add listener or request handlers
      root.drivers[storageInfo.driver]( root, storageInfo)
    })

    root.dep.bus.expand( root )
    root.dep.request.expand( root )
  }
}