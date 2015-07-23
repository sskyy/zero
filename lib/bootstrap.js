var _ = require('lodash'),
  co = require('co'),
  OrderedList = require('roof-bus/lib/orderedList');

function isGenerator(fn) {
  return fn.constructor.name === 'GeneratorFunction';
}

module.exports = function* (modules) {

  var logger = this.logger
  var list = new OrderedList

  _.forEach(modules, function (module) {
    if (module.bootstrap) {
      var order = module.bootstrap || {}
      var fn = _.isFunction(module.bootstrap ) ? module.bootstrap : module.bootstrap.fn
      list.insert( `${module.name}.bootstrap`, fn.bind(module), order)
    }
  })

  //启动过程必须同步
  var orderedBootstraps = list.toArray()

  for( var i in orderedBootstraps){
    var bootstrapFn = orderedBootstraps[i]

    if( isGenerator(bootstrapFn) ){
      yield bootstrapFn( this )
    }else{
      bootstrapFn( this )
    }
  }

  return modules
}