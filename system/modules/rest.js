var _  = require('lodash')
var tosource = require('tosource')

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
    this.model = model
  },
  expand : function( module ){
    //read field `models`
    if( !module.models ) return

    var root = this

    module.models.forEach( function( model){
      var modelName = model.identity

      //add route for CRUD function
      _.forEach( restMap, function( requestMethod, instanceMethod  ){
          var url,
          event = modelName+'.'+instanceMethod

        if( instanceMethod == 'find' || instanceMethod == 'create'){
          url = requestMethod.toUpperCase() + ' /'+modelName
        }else{
          url = requestMethod.toUpperCase() + ' /'+modelName + '/:id'
        }

        //add request handler to send model operation result to browser
        //TODO separate the respond handler from route would be better?
        root.request.add( function restCallback( req, res){

          console.log("[REST] fire" , event , _.merge(req.params, req.body, req.query))
          req.bus.fire( event, _.merge(req.params, req.body, req.query) ).then( function(){
            res.json( req.bus.data( modelName + "." + instanceMethod ))
          })

        }, url)
      })



    })


  }
}