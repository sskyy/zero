var _ = require('lodash')

module.exports = {
  isPromiseAlike : function( obj ){
    return _.isObject(obj) && _.isFunction(obj.then) && _.isFunction(obj.catch)
  },
  mergeDefaults : mergeDefaults,
  mergeDeep : mergeDeep
}

function mergeDefaults(a,b){
  return _.partialRight(_.merge, function(a, b){
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

function mergeDeep( a, b){
  return _.partialRight(_.merge , function( a, b){
    if(_.isArray(a) && _.isArray(b)){
      return a.concat(b)
    }else if(_.isObject(a) && _.isObject(b)){
      return mergeDeep(a,b)
    }else{
      return undefined
    }
  })(a, b)
}
