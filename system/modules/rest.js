var _  = require('lodash')
var tosource = require('tosource')

var restMap = {
  'find': 'get',
  'findOne': 'get',
  'update' : 'put',
  'create' : 'post',
  'destroy' : 'delete'
}

var lifeCycleCallback =[
  'beforeCreate',
  'beforeValidate',
  'beforeDestroy',
  'beforeUpdate',
  'afterCreate',
  'afterValidate',
  'afterDestroy',
  'afterUpdate'
]


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
          console.log("[REST] fire" , event , _.merge(req.params, req.body, req.query))
          req.bus.fire( event, _.merge(req.params, req.body, req.query) ).then( function(){
            res.json( req.bus.data('model.'+modelName))
          })
        }, url, function setModelContextForEachReq( req){

          req.bus.models = {}
          _.forEach( root.model.models, function( model, name){


            var clonedModel = _.clone( model )
              clonedModel.__proto__ = model


            lifeCycleCallback.forEach( function( callbackName){
              console.log( tosource(model._callbacks[callbackName][0] ))
              clonedModel._callbacks[callbackName][0] = function( val,cb){
                req.bus.fire('model.'+name+"."+callbackName).then( function(){
                  cb()
                }).fail(_.partial(cb, callbackName +" failed"))
              }
            })

            req.bus.models[name] = clonedModel
          })

        })
      })
    })
  }
}