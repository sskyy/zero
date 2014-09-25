var globalConfig = require('../../config'),
  _ = require('lodash')

module.exports = {
  expand : function( module ){
    var root = this

    root[module.name] = module.config || {}
    //this will override the default config
    module.config = _.defaults( globalConfig[module.name] || {}, module.config || {})
  }
}
