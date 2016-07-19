var load = require('../../lib/load'),
  path = require('path'),
  fs = require('fs'),
  assert = require("assert"),
  co = require('co'),
  logger = require('../../lib/logger')


function mockApp(){
  return {logger}
}

describe('loader test.', function(){

  it("should load all modules", function(cb){
    var modulePath = path.join(__dirname , './modules')
    var moduleFiles = fs.readdirSync(modulePath).filter(function(r){ return !/^\./.test(r)})

    co(function*(){
      var modules = yield load.call( mockApp(), modulePath)
        assert.notEqual( Object.keys(modules),0)
        assert.equal( Object.keys(modules).join(''), moduleFiles.join(''))

    }).then(cb.bind(null,null)).catch(cb)
  })

})