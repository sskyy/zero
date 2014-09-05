var _  = require("lodash")

module.exports = {
  expand : function( module ){
    if( module.models ){
      module.models.forEach(  function( model){
        if( model.isNode ){
          console.log( model.identity ,"is Node")
        }
      })
    }
  }
}