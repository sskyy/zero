var _ = require('lodash')

module.exports = {
  deps: ['request','model', 'bus'],
  route : {
    "*" : {
      "function" :function( req, res){
        ZERO.mlog("respond"," respond default handler take action",req.bus._fired)
        //bus never fired and not request handler take action, we send 404
        if( !req.bus._fired ){
          ZERO.mlog("respond"," NOTHING HAPPENED")
          res.status(404).send("404")
        }else{
          //must wait all result resolved!
          req.bus.then(function(){
//          ZERO.mlog("respond"," success respond", req.bus.data('respond'))
            ZERO.mlog("respond"," success respond")
            res.json( req.bus.data('respond'))
          }).fail( function(err) {
            ZERO.warn("respond"," on error",err)
            var error = req.bus.error()[0]
            if ( !error) error = {status:500, msg:'UNKNOWN ERROR'}
            res.status(error.status).json(error)
          })
        }
      },
      order : {last:true}
    }
  }
}