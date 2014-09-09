var _ = require('lodash')

module.exports = {
  deps: ['request','model', 'bus'],
  bootstrap : function(){

    var root = this

    //last. default request handler
    this.dep.request.add( function( req, res){
      console.log("[RESPOND] respond default handler take action",req.bus._fired)
      //bus never fired and not request handler take action, we send 404
      if( !req.bus._fired ){
        console.log("[RESPOND] NOTHING HAPPENED")
        res.status(404).end()
      }else{
        //must wait all result resolved!
        req.bus.then(function(){
          console.log("[RESPOND] success respond", req.bus.data('respond'))
          console.log( req.bus.error()[0] )
          res.json( req.bus.data('respond'))
        }).fail( function(err) {
          console.log("[RESPOND] on error",err)
          var error = req.bus.error()[0]
          if ( !error) error = {status:500, msg:'UNKNOWN ERROR'}
          res.status(error.status).json(error)
        })
      }
    },'*')
  }

}