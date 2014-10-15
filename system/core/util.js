var _ = require('lodash')

module.exports = {
  isPromiseAlike : function( obj ){
    return _.isObject(obj) && _.isFunction(obj.then) && _.isFunction(obj.catch)
  }
}