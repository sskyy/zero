var _ = require("lodash")

module.exports = {
  expand : function( module ){
    var root = this
    if( module.file ){
      _.forEach( module.file, function( path, prefix){
        root.app.use( prefix, root.app.express.static( path) )
      })
    }
  }
}