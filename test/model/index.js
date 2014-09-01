var loader = require('../../system/core/loader'),
  path = require('path'),
  bootstrap  = require('../../system/core/bootstrap')

function print(obj){
  console.log( JSON.stringify(obj, null, 4))
}

describe('loader test.', function(){
  var app = { _route : {}}
  app.route = function( url, callback ){
    this._route[url] = {}
    return this
  }
  app.all = app.get = app.post = app.delete = app.put = function(){}


  bootstrap( app,{modulePath:path.join(__dirname , './modules')},function(){
//      print( app.modules.bus.bus._events)
    print( app._route)
    print( app.modules.bus.bus._events)
  })

  it("should create user", function(cb){


  })


})