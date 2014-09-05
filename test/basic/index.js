var Bus = require('../../system/core/bus'),
  assert = require('assert'),
  q = require('q')

function print( obj){
  console.log( JSON.stringify(obj, null, 4))
}

describe('bus test.',function(){
  it("should save and retrieve data correctly", function( ){
    var bus = new Bus,
      naiveData = "hahaah",
      objectData = {name:"hahaha"}

    bus.start()


    bus.data("module.data1", naiveData)
    bus.data("module.data2", objectData)

    console.log( bus.$$data )

    assert.equal( bus.data("module.data1").toString(), naiveData.toString())
    assert.equal( bus.data("module.data2").toString(), objectData.toString())
  })


  it("should fire with decorator", function( ){
    var bus = (new Bus).fork(),
      event = "someEvent"

      bus.on(event+".before",function before(){
        console.log("before",event)
      })

      bus.on(event,function on(){
        console.log( "on",event)
      })

    bus.on(event+".after",function after(){
      console.log( "after",event)
    })

    bus.start()
    var res = bus.fireWithDecorator( event).then(function(){

      print( bus.$$traceStack )

    })
  })

  //TODO test allSettled function with promise in promise result
  it("should wait for cas promise resolve or reject", function( cb ){
    q.all([q.promise(function( resolve, reject){
      return q.promise( function(resolve, reject){
        setTimeout( function(){
          reject("hahaha")
        }, 300)
      }).then(resolve).fail(reject)

    }),11]).then(function(a){
      console.log("resolve!!!resolve",a)
      cb()
    }).fail(function(err){
      console.log("reject",err)
      cb()
    })
  })

  it("should wait all nested promise resolve", function( cb ){

    var bus = (new Bus).fork(),
      event = "someEvent"


    bus.on(event,function on(){
        return bus.error("some err")
    })


    bus.start()
    bus.fire( event)

    bus.then( function(){
      cb()
    }).fail(function(){
      console.log("error should fire")
      cb()
    })

  })
})