var Bus = require('../../system/core/bus'),
  assert = require('assert')

describe('bus test.',function(){
  it("should save and retrieve data correctly", function( ){
    var bus = new Bus,
      naiveData = "hahaah",
      objectData = {name:"hahaha"}


    bus.data("module.data1", naiveData)
    bus.data("module.data2", objectData)

    console.log( bus.$$data )

    assert.equal( bus.data("module.data1").toString(), naiveData.toString())
    assert.equal( bus.data("module.data2").toString(), objectData.toString())
  })

  it("snapshot should share runtime with fork object", function(){
    var bus = new Bus,
    forkedBus = bus.fork(),
    snapshotBus = forkedBus.snapshot()



  })
})