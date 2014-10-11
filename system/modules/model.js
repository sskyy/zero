var q = require('q'),
  Waterline = require('waterline'),
  _ = require('lodash')


var diskAdapter = require('sails-disk')
var mongoAdapter = require('sails-mongo')

var config = {
  adapters: {
    'default': mongoAdapter,
    disk: diskAdapter,
    mongo : mongoAdapter
  },
  connections: {
    localDisk: {
      adapter: 'disk'
    },
    mongo : {
      adapter : 'mongo'
    }
  },
  defaults: {
    migrate: 'alter'
  }
};

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

function extendListener(module) {
  //TODO listen model:action
  module.listen = {}

  _.forEach( module.models, function( model, name){

    ['find', 'create', 'update', 'destroy','findOne'].forEach(function (method) {

      module.listen[ name+'.'+method] ={
        "name" : method + name[0].toUpperCase() + name.slice(1),
        "function": function () {
          ZERO.mlog("model","on ", name, method, arguments)
          //this bus is a started forked bus or snapshot
          var bus = this

          //we should use cloned orm model function, so inside the function we can trigger lifecycle callbacks
          var clonedModel = cloneModel(module.models[name], name, bus.snapshot())

          return clonedModel[method].apply(clonedModel, arguments).then(done)

          function done(data){
            console.log(name + "." + method,"find data!!!!!!!!!!!",data.length)
            bus.data(name + "." + method, data)
            return data
          }

          function fail(err){
            console.error("model err", err)
            return bus.error(err)
          }
        }
      }
    })
  })
}

function cloneModel( model,name, bus ){

  var clonedModel = _.clone( model )
  clonedModel._callbacks = _.cloneDeep(model._callbacks)

  lifeCycleCallback.forEach( function( callbackName){

    clonedModel._callbacks[callbackName].push( function modelLifeCycleCallback( val,cb){
      var transformCallbackName = callbackName.replace(/([a-z]+)([A-Z])([a-z]+)/,"$2$3.$1").toLowerCase()
      bus.fire( name+"."+transformCallbackName, val).then( function(){
        cb()
      }).fail(function(err){
        ZERO.error("LIFE CYCLE CALLBACK FAILED",err)
        cb(name+"."+transformCallbackName + " failed" )
      })
    })
  })

  clonedModel.__proto__ = model
  return clonedModel
}

/**
 * 为所有定义了 models 属性的模块提供 orm 服务。
 * @module model
 */
module.exports = {
  deps : ['bus'],
  orm: new Waterline,
  models : {},
  /**
   * 如果模块定义了 models 属性，则读取其中的每个 model 定义，并通过 waterline 来建立 orm 。
   * 所有建立的 model 对象都将存在此模块的 models 属性中，可以直接调用。
   * 也可以通过例如 `bus.fire("model.find")` 的方式来调用，推荐使用这种方式。
   * @param module
   */
  expand: function (module) {
    var root = this
    if (!module.models) return

    module.models.forEach(function (model) {
      //add model placeholder here, so other modules may know what models are registered
      if( root.models[model.identity]){
        ZERO.warn("duplicated model definition :",model.identity,"from",root.name)
      }else{
        root.models[model.identity] = _.defaults(model,{
          migrate : 'safe',
          connection : 'mongoAdapter'
        })
      }
    })
  },
  bootstrap: function () {
    var root = this

    _.forEach(root.models,function(model){
      root.orm.loadCollection(Waterline.Collection.extend(model))
    })

    return q.promise(function (resolve, reject) {
      root.orm.initialize(config, function (err, models) {
        if (err) return reject( err);

        _.extend( root.models , models.collections )
        root.connections = models.connections;


        //add listen to this module
        //manually use module bus to add listeners
        extendListener(root)
//        ZERO.mlog("model","[after extend listener]", root.listen)
        root.dep.bus.expand(root)
        resolve()
      });
    })
  }
}