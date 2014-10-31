var Bus = require('../../lib/app/system/core/bus'),
  assert = require('assert'),
  Promise = require('bluebird'),
  _ = require('lodash')


describe('bus test.',function(){
  var baseBus
  beforeEach(function(){
    baseBus = new Bus
  })


  it("should save and retrieve data correctly", function( ){
    var bus = baseBus.fork(),
      naiveData = "naiveData",
      objectData = {name:"zero"}

    bus.start()

    bus.data("module.data1", naiveData)
    bus.data("module.data2", objectData)

    assert.equal( bus.data("module.data1").toString(), naiveData.toString())
    assert.equal( bus.data("module.data2").toString(), objectData.toString())
  })

  it("should merge data",function(){
    var bus = baseBus.fork(),
      originData = {id:1,name:'zero'},
      mergeData = {age:1,gender:"male"}

    bus.start()

    bus.data('respond.data', _.cloneDeep(originData))
    assert.equal( Object.keys(originData).length, Object.keys( bus['$$data'].respond.data).length)

    bus.data('respond.data',_.cloneDeep(mergeData))
    assert.equal( Object.keys(originData).length + Object.keys( mergeData).length, Object.keys( bus['$$data'].respond.data).length)
  })


  it("fcall should fire with decorator", function( done ){
    var bus = baseBus.fork(),
      event = "someEvent",
      fireStack = [],
      expectFireStack = ['before','fn','after']

    bus.on(event+".before",function before(){
        fireStack.push(expectFireStack[0])
    })

    bus.on(event+".after",function after(){
      fireStack.push(expectFireStack[2])
    })

    var fnTobeCalled = function(){
      fireStack.push(expectFireStack[1])
    }

    bus.start()

    bus.fcall( event,fnTobeCalled).then(function(){
      assert.equal( fireStack.toString(), expectFireStack.toString())
      done()
    })
  })

  //not supported now
  //it("should wait for cas promise resolve or reject", function( cb ){
  //  Promise.all([ new Promise(function( resolve, reject){
  //    return q.promise( function(resolve, reject){
  //      setTimeout( function(){
  //        reject("hahaha")
  //      }, 300)
  //    }).then(resolve).fail(reject)
  //
  //  }),11]).then(function(a){
  //    console.log("resolve!!!resolve",a)
  //    cb()
  //  }).fail(function(err){
  //    console.log("reject",err)
  //    cb()
  //  })
  //})


  it("should fail when return bus.error", function( done ){
    var bus = baseBus.fork(),
      event = "someEvent"

    bus.on(event,function on(){
        return bus.error("some err")
    })

    bus.start()


    bus.fire( event)

    bus.then( function(){
      done("should not succeed")
    }).catch(function(){
      done()
    })

  })

  it( "should resolve when everything is fine", function(cb){
    var bus = baseBus.fork(),
      event = "someEvent"

    bus.on(event,function on(){
      return "happy here"
    })

    bus.start()

    bus.fire( event).then( function(){
      cb()
    }).catch(function(){
      cb("should not failed")
    })
  })


  it("should execute in order", function( cb ){
    var fireStack = [],
      expectStack = ["one","two","three"]

    var bus = baseBus.fork()

    bus.on(expectStack[0],function (){
      fireStack.push(expectStack[0])
      return this.fire(expectStack[1])
    })

    bus.on(expectStack[1],function(){
      return new Promise(function(resolve, reject){
        setTimeout(function(){
          fireStack.push(expectStack[1])
          resolve()
        },50)
      })
    })

    bus.start()
    bus.fire(expectStack[0]).then(function(){
      fireStack.push(expectStack[2])
      assert.equal(fireStack.toString(), expectStack.toString())
      cb()
    })
  })

  it("should wait all pre fire events end before bus.then execute",function(cb){

    var fireStack = [],
      expectStack = ["one","two","three","four"]

    var bus = baseBus.fork()

    bus.on(expectStack[0],function (){
      fireStack.push(expectStack[0])
      return this.fire(expectStack[1])
    })

    bus.on(expectStack[1],function(){
      return new Promise(function(resolve, reject){
        setTimeout(function(){
          fireStack.push(expectStack[1])
          resolve()
        },50)
      })
    })



    bus.start()

    bus.fire(expectStack[0]).then(function(){
      fireStack.push(expectStack[2])
    })

    bus.then(function(){
      fireStack.push(expectStack[3])
      assert.equal(fireStack.toString(), expectStack.toString())
      cb()
    }).catch(function(e){
      cb(e)
    })
  })


  //TODO should nest all result correctly
  it("should wait all pre fire events end before bus.then execute",function(cb){

    var fireStack =  ["one","two","three","four"]

    var bus = baseBus.fork(),finalResult = "zero"

    bus.on(fireStack[0],function fn0(){
      return this.fire(fireStack[1])
    })

    bus.on(fireStack[1], function fn1(){
      return new Promise(function(resolve, reject){
        setTimeout(function(){
          resolve( finalResult )
        },50)
      })
    })

    bus.start()

    bus.fire(fireStack[0]).then(function( res ){
      assert.equal(res.toString(), {"global.fn0":{"global.fn1":finalResult}}.toString())
      cb()
    }).catch(function(e){
      cb(e)
    })

  })
})