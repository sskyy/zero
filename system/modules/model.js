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

function extendListener(module) {
  module.listen = {}

  _.forEach( module.models, function( model, name){
    ['find', 'create', 'update', 'destroy','findOne'].forEach(function (method) {

      module.listen[ name+'.'+method] = function (arg) {
        console.log("on ", name, method, arg)
        var bus = this

        return bus.models[name][method](arg).then( function( data){
          console.log("=======")
          bus.data("model."+ name , data)
        }).fail(function(err){
          console.error("model err", err)
        })
      }
    })
  })
}

module.exports = {
  dependencies: ['bus'],
  orm: new Waterline,
  init: function (bus) {
    this.bus = bus
  },
  expand: function (module) {
    var root = this
    if (!module.models) return

    //TODO merge life circle callbacks
    module.models.forEach(function (model) {
      root.orm.loadCollection(Waterline.Collection.extend(model));
    })
  },
  bootstrap: function () {
    var root = this

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