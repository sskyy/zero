var q = require('q'),
  Waterline = require('waterline'),
  _ = require('lodash')


var diskAdapter = require('sails-disk')

var config = {
  adapters: {
    'default': diskAdapter,
    disk: diskAdapter
  },
  connections: {
    myLocalDisk: {
      adapter: 'disk'
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
  module.listen = {}

  _.forEach( module.models, function( model, name){

    ['find', 'create', 'update', 'destroy','findOne'].forEach(function (method) {

      module.listen[ name+'.'+method] ={
        "name" : method + name[0].toUpperCase() + name.slice(1),
        "function": function (arg) {
          console.log("on ", name, method, arg)
          //this bus is a started forked bus or snapshot
          var bus = this

          //we should use cloned orm model function, so inside the function we can trigger lifecycle callbacks
          var clonedModel = cloneModel(module.models[name], name, bus)

          return clonedModel[method](arg).then(function (data) {
            bus.data(name + "." + method, data)
            return data
          }).fail(function (err) {
            console.error("model err", err)
            return bus.error(err)
          })
        }
      }
    })
  })
}

function cloneModel( model,name, bus ){

  var clonedModel = _.clone( model )
  clonedModel._callbacks = _.cloneDeep(model._callbacks)

  lifeCycleCallback.forEach( function( callbackName){

    var transformCallbackName = callbackName.replace(/([a-z]+)([A-Z])([a-z]+)/,"$2$3.$1").toLowerCase()
    clonedModel._callbacks[callbackName].push( function modelLifeCycleCallback( val,cb){
      bus.fire( name+"."+transformCallbackName, val).then( function(){
        cb()
      }).fail(function(){
        cb(name+"."+transformCallbackName + " failed" )
      })
    })
  })

  clonedModel.__proto__ = model
  return clonedModel
}

module.exports = {
  deps : ['bus'],
  orm: new Waterline,
  models : {},
  expand: function (module) {
    var root = this
    if (!module.models) return

    module.models.forEach(function (model) {
      //add model placeholder here, so other modules may know what models are registered
      root.models[model.identity] = model
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

        root.models  = models.collections;
        root.connections = models.connections;


        //add listen to this module
        //manually use module bus to add listeners
        extendListener(root)
        console.log("[after extend listener]", root.listen)
        root.dep.bus.expand(root)

        resolve()
      });
    }).fail("err",function(err){
      console.log( "model fail=====", err)
    })
  }
}