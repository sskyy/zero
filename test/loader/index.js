var loader = require('../../system/core/loader'),
  path = require('path'),
  bootstrap  = require('../../system/core/bootstrap')

describe('loader test.', function(){

  it("should load module all modules", function(cb){


    loader.loadAll({modulePath:path.join(__dirname , './modules'),systemModulePath:path.join(__dirname , './systemModules')}, function(){
      console.log( loader.modules() )
      cb()
    })
  })


})