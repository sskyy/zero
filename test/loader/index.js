var loader = require('../../lib/app/system/core/loader'),
  path = require('path'),
  fs = require('fs'),
  bootstrap  = require('../../lib/app/system/core/bootstrap'),
  assert = require("assert")


describe('loader test.', function(){
  it("should load all modules", function(cb){
    var modulePath = path.join(__dirname , './modules')
    var moduleFiles = fs.readdirSync(modulePath).filter(function(r){ return !/^\./.test(r)})
    loader.loadAll({modulePath:modulePath}, function( err, modules){
      assert.equal(err,undefined)
      assert.equal( Object.keys(modules).toString(), moduleFiles.toString())
      cb()
    })
  })

})