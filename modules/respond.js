var _ = require('lodash')

module.exports = {
  dependencies: ['request','model', 'bus'],
  init : function( request, model ){
    this.request = request
    this.model = model
  },
  bootstrap : function(){

    var root = this

    //1. add route for model action
    _.forEach(root.model.models, function( model, modelName){
      root.request.add( function restActionCallback( req, res, next){

        console.log("[REST] rest request handler take action", req.bus._id)
        //TODO fire with decorator
        var action = req.param('action')
        req.bus.fire( modelName + "." + req.param('action'), _.omit(_.merge(req.params, req.body, req.query),['action']))

        //we will use default request handler for model actions
        next()
      }, 'POST /'+modelName + '/:action')
    })

    //TODO 2. add theme request handler



    //last. default request handler
    this.request.add( function( req, res){
      console.log("[RESPOND] respond default handler take action",req.bus._id,req.bus._fired)
      //bus never fired and not request handler take action, we send 404
      if( !req.bus._fired ){
        console.log("[RESPOND] NOTHING HAPPENED")
        res.status(404).end()
      }else{
        //must wait all result resolved!
        req.bus.then(function(){
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