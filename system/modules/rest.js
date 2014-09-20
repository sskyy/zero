var _  = require('lodash')
var tosource = require('tosource')

var restMap = {
  'find': 'get',
  'findOne': 'get',
  'update' : 'put',
  'create' : 'post',
  'destroy' : 'delete'
}

/**
 * 为依赖次模块的其他模块的 model 提供 rest 接口
 * @module rest
 */
module.exports = {
  deps : ['respond','model','request'],
  /**
   * 如果模块声明的 model 中的 rest 属性为 true, 则自动为该 model 添加 rest 接口。
   * @param module
   */
  expand : function( module ){
    //read field `models`
    if( !module.models ) return

    var root = this

    module.models.forEach( function( model){
      if( !model.rest ) return

      var modelName = model.identity

      //1. add route for CRUD function
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
        root.dep.request.add( url, function restCallback( req, res, next){

          ZERO.mlog("REST","fire" , event ,req.params, _.merge(req.params, req.body, req.query))
          req.bus.fire( event, _.merge(req.params, req.body, req.query) ).then( function(){
            //use respond module to help us respond
            req.bus.data("respond.data", _.cloneDeep(req.bus.data( modelName + "." + instanceMethod )))
            next()
          })
        })
      })


      //2. add route for model action
      root.dep.request.add('POST /'+modelName + '/:action', function restActionCallback( req, res, next){
        //rest api handled already
        if( req.bus.data('respond.data')) return next()

        ZERO.mlog("REST", "rest request handler take action", req.bus._id)
        var action = req.param('action')
        req.bus.fire( modelName + "." + req.param('action'), _.omit(_.merge(req.params, req.body, req.query),['action']))

        //we will use default request handler for model actions
        next()
      })
    })
  }
}