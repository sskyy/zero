var Q = require('q'),
  _ = require('lodash')

/**
 * Create a Bus instance.
 * Notice the 'events' object will be like this:
 * {
 *  "{namespace}" : {
 *      "listeners" : [{
 *        "name" : "{function name or alias}",
 *        "module" : "{module name}"
 *      }],
 *      "children" : {
 *        "str" : {
 *          "{child namespace}" : {
 *            "name" : "{module name}.{function name or alias}",
 *          }
 *        },
 *        "reg" : {
 *          "{regular expression}":{
 *            "name" : "{module name}.{function name or alias}",
 *          }
 *        }
 *      }
 *    }
 * }
 *
 * static data in Bus start with "_", runtime data start with "$$"
 * @constructor
 * @param {object} opt - options
 */
function Bus(opt) {
  this.opt = _.defaults(opt || {}, {
    nsSplit: '.', //namespace split
    varSign: ':', //variable sign
    varSplit: '/',
    muteReg: /^!/,
    targetReg: /^@/,
    track: true
  })

  this._mute = {}
  this._events = {listeners: [], children: {"str": {}, "reg": {}}}
  this._started = false
  this._id = 1
  this._forked =0
}

Bus.prototype.fork = function () {
  var root = this

  var newEmptyBust = {
    _forked: true,
    _origin :root,
    _fired : false,
    _id : root._forked + 1,
    _snapshoted : 0
  }

  //clone every thing including functions except runtime data
  for (var i in root) {
    !isRuntimeAttr(i) && (newEmptyBust[i] = root[i] )
  }

  root._forked++
  return newEmptyBust
}

Bus.prototype.snapshot = function(){
  if( !this._started ){
    console.log("you can only snapshot started bus")
    return false
  }

  var root = this

  var newSnapshot = {
    _snapshot : true,
    _origin : root,
    _id : root._id * 100 + root._snapshoted + 1
  }

  //clone everything include runtime attributes
  for( var i in root ){
    newSnapshot[i] = root[i]
  }

  root._snapshoted++
  return newSnapshot
}

function isRuntimeAttr(i) {
  return /^$$/.test(i)
}


/**
 * reset runtime data
 */
Bus.prototype.start = Bus.prototype.restart = function () {
  var root = this
  //runtime mute must be clear every time
  root.empty()
  if (root.opt.track === true)  root.setTracker()

  //runtime data must be set to here, or snapshot will create it own
  _.forEach(['$$data','$$results'],function(key){
      root[key] = {}
    })
  root['$$error'] = []

  root._started = true
}

Bus.prototype.empty = function () {
  var root = this
  for (var i in root) {
    if (isRuntimeAttr(i)) {
      delete root[i]
    }
  }
}

Bus.prototype.setTracker = function () {

  this.$$traceStack = []
  //set reference to root when start
  this.$$traceRef = this.$$traceStack
}

Bus.prototype.data = function( name, data){
  if( !this._started ){
    console.log("bus not started")
    return false
  }

  if( !name ) return this.$$data

  if( !data ){
    var ref = getRef( this.$$data, name)
    console.log("[BUS] getting data", name, this.$$data, ref)
    return _.isObject(ref)?_.cloneDeep(ref):ref
  }else{
    setRef( this.$$data, name, data)
    return data
  }
}

function getRef( obj, name ){
  var ns = name.split('.'),
    ref = obj,
    currentName

  while( currentName = ns.shift() ){
    if(_.isObject(ref) && ref[currentName]){
      ref = ref[currentName]
    }else{
      ref = undefined
      break;
    }
  }
  return ref
}

function setRef( obj, name, data){
  console.log( "[BUS] setting data", name, data)

  var ns = name.split('.'),
    ref = obj,
    currentName

  while( currentName = ns.shift() ){
    if( _.isObject(ref) && ref[currentName]){
      ref = ref[currentName]
    }else{
      ref[currentName] = {}
      ref = ref[currentName]
    }
  }
  //TODO better way?
  eval("obj."+name +"=data")

  console.log("[BUS] setting done", name, obj)
}

Bus.prototype.module = function( name ){
  if( !name ){
    return this.$$module
  }else{

    this.$$module = name
  }
}

/**
 * Attach a event to the Bus
 * @param {string} eventOrg - original event name with namespace. "" match root.
 * @param {mix} listener - listener can be both function or array
 * @param {mix} opt - for mute and other options
 */
Bus.prototype.on = function (eventOrg, listener, opt) {
  var eventRef,
    namespace = eventOrg.split(this.opt.nsSplit),
    n,
    root = this,
    replacedName = []

  opt = opt || {}
  root["$$module"] = opt.module || root["$$module"] || 'global'

  if (root._started) {
    //dynamic attach
    root.$$events = _.cloneDeep(root._events)
    eventRef = root.$$events
  } else {
    if (root._forked || root._snapshot) {
      root._events = _.cloneDeep(root._events)
    }
    eventRef = root._events
  }

  if (eventOrg !== "") {
    while (n = namespace.shift()) {
      var type = n.indexOf(root.opt.varSign) == -1 ? "str" : "reg"

      type == "reg" && (n = n.replace(/(^|\/):\w+(\/|$)/g, "$1(.*)$2"))

      eventRef.children[type][n] ||
      (eventRef.children[type][n] = {listeners: [], children: {"str": {}, "reg": {}}})

      eventRef = eventRef.children[type][n]
      //TODO cache for?
      replacedName.push(n)
    }
  }

  //standardize the listen data structure
  listener = this.standardListener(listener, opt)

  //deal with mute opt
  opt && opt.mute && root.addMute(opt.mute, listener)

  //deal with order
  var place = root.findPlace(listener, eventRef.listeners, replacedName.join(root.opt.nsSplit))

  // insert the listener to right place
  eventRef.listeners = arrayInsert(eventRef.listeners, place, listener)

}

Bus.prototype.standardListener = function (org, opt) {
  var res = {"name": this.$$module + '.', "function": noop, "module": this.$$module},
    root = this

  if (typeof org == 'function') {
    res.name += org.name || 'anonymous'
    res.function = org
  } else {
    if (Object.keys(org).length !== 1) {
      res = _.extend(res, org)
      res.name = res.module + "." + (res.name || 'anonymous')
    } else {
      var key = Object.keys(org).pop()
      res.name += key
      res.function = org[key]
    }
  }
  res = _.defaults(res, opt)
  if (res.module !== this.$$module) {
    res.vendor = this.$$module
  }

  //add decorator
  //TODO is it the best way to do it ?
//  ['before', 'after'].forEach(function (i) {
//    if (res[i] && res[i].indexOf('.') == -1)
//      res[i] = root.$$module + '.' + res[i]
//  })

  return res
}

Bus.prototype.addMute = function (mute, firer) {
  var root = this, container

  if (root._forked||root._snapshot) {
    root._mute = _.cloneDeep(root._mute)
  }

  if (root._started) {
    root.$$mute = _.cloneDeep(root._mute)
    container = root.$$mute
  } else {
    container = root._mute
  }

  container.push(firer)
}

function arrayInsert(arr, place, item) {
  return arr.slice(0, place).concat(item, arr.slice(place))
}

Bus.prototype.findPlace = function (listener, listeners, cacheIndex) {
  if (!this._firstLastCache) this._firstLastCache = {}

  var firstLast = this._firstLastCache[cacheIndex] || findIndex(listeners, function (e) {
    return e.last == true
  })
  if (cacheIndex) {
    if (firstLast == -1 && listener.last) {
      this._firstLastCache[cacheIndex] = listeners.length
    } else if (firstLast != -1 && !listener.last) {
      this._firstLastCache[cacheIndex] = firstLast + 1
    }
  }

  return listener.first ? 0 :
    listener.before ? findIndex(listeners, function (e) {
      return e.name == listener.before
    }) :
      listener.after ? findIndex(listeners, function (e) {
        return e.name == listener.before
      }) + 1 :
        listener.last ? listeners.length :
          (firstLast == -1 ? listeners.length : firstLast)
}

function getTargetStack(namespace, stack) {
  var n
  while (n = namespace.shift()) {
    stack = stack.reduce(function (init, b) {
      var args = b.arguments, ns = b.namespace ? b.namespace.split('.') : []

      if (b.children.str[n])
        init.push(_.extend({"arguments": args, "namespace": ns.concat(n).join('.')}, b.children.str[n]))

      if (Object.keys(b.children.reg).length) {
        _.forEach(b.children.reg, function (child, regStr) {
          var reg = new RegExp(regStr),
            matches = n.match(reg)

          if (matches) {
            init.push(
              _.extend({
                "arguments": args.concat(matches.slice(1)),
                "namespace": ns.concat(regStr).join('.')
              }, b.children.reg[regStr]))
          }
        })
      }
      return init
    }, [])
  }
  return stack
}

function appendChildListeners(stack) {
  var childStack = stack

  while (childStack.length) {
    childStack = childStack.reduce(function (i, b) {
      return i.concat(
        _.values(b.children.str)
          .concat(_.values(b.children.reg))
          .map(function (i) {
            return _.extend({arguments: b.arguments}, i)
          })
      )
    }, [])
    stack = stack.concat(childStack)
  }
  return stack
}


/**
 * @param {string} eventOrg
 * @param {array} args
 * @param {object} opt
 * @returns {object} promise object or array of results returned by listeners
 */
Bus.prototype.fire = function (eventOrg, args, opt) {

  console.log("[BUS] firing :", eventOrg, args)
  if (!this._started) {
    console.log("[BUS] not started!")
    return false
  }
  //should


  var caller = arguments.callee.caller.name

  var stack = [ _.extend({arguments: []}, this.$$events || this._events)],
    eventNs = eventOrg.split(this.opt.nsSplit),
    root = this,
    results = {},
    currentRef,
    firer = root.standardListener({module: root.module, name: caller})

  root['$$results'] = root['$$results'] || {}
  opt = opt || {}
  args = args || []


  //runtime mute, will be clear when restart
  opt.mute && root.addMute(opt.mute, firer)

  if (eventOrg !== "") {
    stack = getTargetStack(eventNs, stack)
  }

  //will opt.cas to true, it will fire all children listeners
  if (opt.cas) {
    stack = appendChildListeners(stack)
  }

  currentRef = root.$$traceRef
  if (root.opt.track) {
    //if fire in a promise callback, set the ref to right one
    root.$$traceRef.push({
      "name": eventOrg,
      "attached": _.extend([], stack.map(function (i) {
        var n = _.extend({}, i, true)
        n.listeners = n.listeners.map(function (l) {
          l.stack = []
          return l
        })
        return n
      }), true)})
  }

  //fire
  var onError = false
  stack.every(function (b, i) {
    if( onError ) return false;//break the loop
    b.listeners.every(function (listener, j) {
      //set $$traceRef back

      var muteList = root.$$mute || root._mute
      if (muteList[listener.name] === undefined) {
        if (root.opt.track) {
          root.$$traceRef = root.$$traceRef[root.$$traceRef.length - 1].attached[i].listeners[j].stack
        }

        console.log("[BUS] appling :", eventOrg, listener.name,listener.module,b.arguments.concat(args))

        var res = listener.function.apply(root.snapshot(), b.arguments.concat(args))

        if (root.opt.track) {
          if (root.$$traceRef !== currentRef) root.$$traceRef = currentRef
          root.$$traceRef[root.$$traceRef.length - 1].attached[i].listeners[j].result = res
        }

        results[listener.name] = res
        if( res instanceof  BusError ){
          onError = true
          return false//break the loop
        }
      }
      return true //continue loop
    })
    return true //continue loop
  })

  if (root.opt.track)  root.$$traceRef = currentRef

  _.extend(root['$$results'], _.zipObject([eventOrg], [results]))
//  console.log( "$$results",root['$$results'])

  console.log("[BUS] bus fired!!!!")
  this._fired = true

  return wrapAsPromise(results)
}

Bus.prototype.fireWithDecorator = function( eventOrg, args, opt){
  var root = this
  return root.fire( eventOrg + ".before" , args, opt).then( function(){
    return root.fire( eventOrg, args, opt).then( function(){
      return root.fire( eventOrg + ".after", args, opt)
    })
  })
}

/************************/
/*  Promise extension   */
/************************/

function nestedBusPromise( obj ){
  var defer = Q.defer()

  if( Q.isPromise( obj )){
    obj.then(function( resolvedObj ){
      return nestedBusPromise( resolvedObj).then( defer.resolve )
    }).fail( defer.reject )
  }else if(_.isObject(obj)){
    Q.all(_.values( obj).map(function( v ){ return nestedBusPromise(v)}) ).then(defer.resolve).fail(defer.reject)
  }else{
    return obj instanceof BusError ? rejectedPromise( obj.status) : resolvedPromise(obj)
  }

  return defer.promise
}

function rejectedPromise( err ){
  return Q.promise(function( resolve, reject){ reject(err) })
}

function resolvedPromise( obj ){
  return Q.promise(function(resolve){ resolve(obj)})
}

function extractPromiseValue( values ){
  return _.mapValues( values,function(i){
    return Q.isPromise(i) ? extractPromiseValue(i.value) : i
  })
}

//TODO every time we call then, we create a new promise based on current $$result, better way to do this?
Bus.prototype.then = function(cb){
  var root = this

  return nestedBusPromise( root['$$results'] ).then(function( values ){
     return cb.call( root, extractPromiseValue( values ) )
  })
}

//TODO every time we call fail, we create a new promise based on current $$result, better way to do this?
Bus.prototype.fail = function(cb){
  var root = this

  return nestedBusPromise( root['$$results'] ).fail(function( err ){
    return cb.call( root, err )
  })
}


/**
 * PromiseLikeObject
 */
function promiseLikeObject( data ){
  _.extend( this, data)
}

promiseLikeObject.prototype.then = function( cb ){
  //if any listener return a error instance, we reject the promise at once.
  var root = this

  //if _promise not initialized
  root._promise = root._promise || nestedBusPromise( this )

  return root._promise.then(function( values ){
    return cb.call( root,  addKeys(root, extractPromiseValue(values)))
  })
}

function addKeys( obj, values){
  return _.omit(_.zipObject(Object.keys(obj), values), function(v){
    return typeof v === undefined
  })
}

promiseLikeObject.prototype.fail = function( cb ){
  //if any listener return a error instance, we reject the promise at once.
  var err = _.first(_.values(this), function(i){ return i instanceof BusError})
  if( err ){
    console.log("[BUS] fire failed:", err)
    return cb.call( this,  err)
  }

  var root = this
  root._promise = root._promise || Q.all(_.reduce( this, function( a, b ){
    var transformB

    //wrap promiseLikeObject to real Q promise object
    if( b instanceof promiseLikeObject){

      transformB = Q.promise(function( resolve, reject){
        b.then(d.resolve).fail(reject)
      })

    }else if( b instanceof BusError ){

      transformB = rejectedPromise(err.status)

    }else{
      transformB = b
    }

    return a.concat( transformB )
  },[]))

  return root._promise.fail(function( err){
    return cb.call( this,  err)
  })
}

function wrapAsPromise( result ){
  var promiseLike =  new promiseLikeObject( result )
  return promiseLike
}

function BusError(reason){
  _.extend(this,reason)
}

Bus.prototype.error = function( status, error ){

  if( arguments.length == 0 )return this.$$error

  var reason

  if( arguments.length == 1 ){
    if( !status.status ){
      reason = {status:500, error:status}
    }else{
      reason = status
    }
  }else{
    reason = {status:status, error :error}
  }

  var busError = new BusError(reason)
  this.$$error.push(busError)
  return busError
}


function noop() {}

function findIndex(list, iterator) {
  var index = -1
  list.every(function (e, i) {
    if (iterator.apply(this, arguments) === true) {
      index = i
      return false
    }
    return true
  })

  return index
}

module.exports = Bus
