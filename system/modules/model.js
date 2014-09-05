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

      module.listen[ name+'.'+method] = function (arg) {
        console.log("on ", name, method, arg)
        //this bus is a started forked bus or snapshot
        var bus = this

        //we should use cloned orm model function, so inside the function we can trigger lifecycle callbacks
        var clonedModels = cloneModels( module.models, bus )

        //TODO we use bus.models means we know we attached models to bus, this is not right
        return clonedModels[name][method](arg).then( function( data){
          bus.data( name+"."+ method , data)
          return data
        }).fail(function(err){
          console.error("model err", err)
          return bus.error(err)
        })
      }
    })
  })
}

function cloneModels( models, bus ){
  var cloned = {}

  _.forEach( models, function( model, name){

    var clonedModel = _.clone( model )
    clonedModel.__proto__ = model

    lifeCycleCallback.forEach( function( callbackName){

      var transformCallbackName = callbackName.replace(/([a-z]+)([A-Z])([a-z]+)/,"$2$3.$1").toLowerCase()
      clonedModel._callbacks[callbackName].push(function( val,cb){
        bus.fire( name+"."+transformCallbackName, val).then( function(){
          cb()
        }).fail(_.partial(cb, transformCallbackName +" failed"))
      })

    })

    cloned[name] = clonedModel
  })
  return cloned
}

module.exports = {
  dependencies: ['bus'],
  orm: new Waterline,
  init: function (bus) {
    this.bus = bus
    this.models = {}
  },
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

        root.models = root.app.models = models.collections;
        root.connections = models.connections;


        //add listen to this module
        //manually use module bus to add listeners
        extendListener(root)
        console.log("[after extent listener]", root.listen)
        root.bus.expand(root)

        resolve()
      });
    })
  }
}