var _ = require('lodash')

module.exports = {
  dependencies: ['request','model', 'bus'],
  init : function( request ){
    this.request = request
  },
  bootstrap : function(){
    //default request handler

    this.request.add( function( req, res){
      if( !req.bus.data() ){
        res.status(404).end()
      }else{
        res.json( req.bus.data())
      }
    },'*')
  }

}