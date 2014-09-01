var _  = require('lodash')

var restMap = {
  'find': 'get',
  'findOne': 'get',
  'update' : 'put',
  'create' : 'post',
  'destroy' : 'delete'
}


module.exports = {
  dependencies : ['model','request'],
  init : function(model, request){
    this.request = request
  },
  expand : function( module ){
    //read field `models`
    if( !module.models ) return

    var root = this

    _.forEach( restMap, function( requestMethod, instanceMethod  ){

      module.models.forEach( function( model){
        var modelName = model.identity,
          url,
          event = modelName+'.'+instanceMethod

        if( instanceMethod == 'find' || instanceMethod == 'create'){
          url = requestMethod.toUpperCase() + ' /'+modelName
        }else{
          url = requestMethod.toUpperCase() + ' /'+modelName + '/:id'
        }

        //add request handler to send model operation result to browser
        //TODO separate the respond handler from route would be better?
        root.request.add( function restCallback( req, res){
          req.bus.fire( event, _.merge(req.params, req.body, req.query) ).then( function(){
            console.log("[REST]" , event , req.bus.data('model.'+modelName))
            res.json( req.bus.data('model.'+modelName))
          })
        }, url )
      })
    })
  }
}