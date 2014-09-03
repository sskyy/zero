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


function setModelContextForEachReq( req, root){

  req.bus.models = {}
  _.forEach( root.model.models, function( model, name){

    var clonedModel = _.clone( model )
    clonedModel.__proto__ = model

    lifeCycleCallback.forEach( function( callbackName){

      var transformCallbackName = callbackName.replace(/([a-z]+)([A-Z])([a-z]+)/,"$2$3.$1").toLowerCase()
      clonedModel._callbacks[callbackName].push(function( val,cb){
        req.bus.fire( name+"."+transformCallbackName, val).then( function(){
          cb()
        }).fail(_.partial(cb, transformCallbackName +" failed"))
      })

    })

    req.bus.models[name] = clonedModel
  })
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
            res.json( req.bus.data('model.'+modelName))
          })

        }, url, _.partialRight(setModelContextForEachReq, root) )
      })

      //add route for model action
      root.request.add( function restActionCallback( req, res, next){

        //TODO fire with decorator
        req.bus.fire( modelName + "." + req.param('action'), _.merge(req.params, req.body, req.query)).then( function(){
          //TODO output all data?
          res.json( req.bus.data() )
        })

      }, 'POST /'+modelName + '/:action',_ .partialRight(setModelContextForEachReq, root))

    })


  }
}