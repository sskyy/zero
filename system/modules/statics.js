var _ = require("lodash")

module.exports = {
  expand : function( module ){
    var root = this
    if( module.statics ){
      _.forEach( module.file, function( path, prefix){
        root.app.use( prefix, root.app.express.static( path) )
      })
    }
  }
}