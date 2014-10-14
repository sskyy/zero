var _  = require('lodash')
var tosource = require('tosource')

var restMap = {
  'find': 'get',
  'findOne': 'get',
  'update' : 'put',
  'create' : 'post',
  'destroy' : 'delete'
}

function hierarchyObject(val){
  var output = _.cloneDeep( val )
  _.forEach(output, function( v, k){
    console.log("has dot",k,k)
    if( k.indexOf(".")>0 ){
      var i= output,stack = k.split("."),n
      while( n = stack.shift() ){
        if( stack.length !== 0){
          i[n] = i[n] || {}
          i= i[n]
        }else{
          i[n] = v
        }
      }
      delete output[k]
    }
  })
  return output
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

        if(['find' ,'create'].indexOf(instanceMethod)!==-1){
          url = requestMethod.toUpperCase() + ' /'+modelName
        }else{
          url = requestMethod.toUpperCase() + ' /'+modelName + '/:id'
        }

        //add request handler to send model operation result to browser
        //TODO separate the respond handler from route would be better?
        root.dep.request.add( url, function crud( req, res, next){

          //TODO convert params which key has '.' to object
          var args = [hierarchyObject(_.merge(req.params, req.body, req.query))]
          if( instanceMethod == 'update' ){
            //TODO only allow update on id
            args.unshift({id: req.param("id")})
          }
          args.unshift(event)
          ZERO.mlog("REST","fire" , event ,args)
          req.bus.fire.apply(req.bus, args ).then( function(){
            //use respond module to help us respond
//            ZERO.mlog("REST","retriving data" , event ,req.bus.data( event ))
            var result = _.cloneDeep(req.bus.data( event ))
            if( instanceMethod =='update' ){
              result = result.pop()
            }
            req.bus.data("respond.data", result)
            next()
          })
        })
      })


      //2. add route for model action
      root.dep.request.add('POST /'+modelName + '/:action', function action( req, res, next){
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