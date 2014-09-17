var Bus = require('../core/bus'),
  _ = require('lodash')

/**
 * 为所有其他模块提供 bus 服务。参见 Bus。
 * @module bus
 */
module.exports = {
  bus : new Bus,
  expand : function( module ){
    var root = this
    if( module.listen ){
//      console.log("[bus expand]",module.name, module.listen)
      _.forEach(module.listen, function( listener, event){
        root.bus.module(module.name)
        root.bus.on(event, listener)
      })
//      console.log("[after bus expand]", root.bus._events)
    }
  }
}