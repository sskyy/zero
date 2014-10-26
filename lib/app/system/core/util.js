var _ = require('lodash')

module.exports = {
  isPromiseAlike : function( obj ){
    return _.isObject(obj) && _.isFunction(obj.then) && _.isFunction(obj.catch)
  },
  mergeDefaults : mergeDefaults
}

function mergeDefaults(a,b){
  _.partialRight(_.merge, function(a, b){
    if(_.isArray(a) ){
      return _.uniq(a.concat(b))
    }else if(_.isObject(a)){
      //return undefined meas go merge children
      return undefined
    }else{
      return b
    }
  })(a,b)
}
