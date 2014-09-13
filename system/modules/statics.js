var _ = require("lodash")

module.exports = {
  expand : function( module ){
    var root = this
    if( module.statics ){
      _.forEach( module.statics, function( path, prefix){
        ZERO.mlog("statics", "expand:", prefix, path)
        APP.use( prefix, APP.express.static( path) )
      })
    }
  }
}