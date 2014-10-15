/**
 * @example _events structure
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
 */



var Promise = require('bluebird'),
  _ = require('lodash'),
  async = require('async'),
  util = require('./util')

Promise.longStackTraces();

/**
 * Bus是一个超级事件代理类。除了普通的on/fire操作以外，它还能有以下高级特性：
 * 1. 指定listener的触发顺序。比如，在最前、最后、在某一个listener前。
 * 2. 触发某一事件时主动屏蔽某一事件listener。
 * 等等。
 * @class
 * @param {object} opt 选项。`nsSplit`:事件名分隔符;`varSign`:事件参数标志;`varSplit`:参数分隔符;`muteReg`:抑制事件正则;`targetReg`:目标事件正则;`track`:是否追踪调用栈;
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
  this._id = 0
  this._forked =0
}

/**
 * 衍生出子Bus，它将完全继承已经注册在父Bus上的事件，和所有除了运行时的属性
 * @returns {Bus} 返回一个新的Bus。
 */
Bus.prototype.fork = function () {
  var root = this

  var newEmptyBust = {
    _fork: true,
    _origin :root,
    _fired : false,
    _snapshoted : 0
  }

  //clone every thing including functions except runtime data
  for (var i in root) {
    !isRuntimeAttr(i) && (newEmptyBust[i] = root[i] )
  }

  newEmptyBust._id = root._forked + 1,
  root._forked++
  return newEmptyBust
}

/**
 * 制作当前Bus的快照，主要用于在追踪调用栈时保存住当前调用栈的引用。它将复制父Bus的所有属性，包括运行时属性。
 * @returns {Bus}
 */
Bus.prototype.snapshot = function(options){
  options = _.defaults(options || {},{
    exclude : []
  })

  if( !this._started ){
    console.log("you can only snapshot started bus")
    return false
  }

  var root = this

  var newSnapshot = {
    _snapshot : true,
    _origin : root
  }

  //clone everything include runtime attributes
  for( var i in root ){
    if( options.exclude.indexOf( i) == -1){
      newSnapshot[i] = root[i]
    }
  }

  newSnapshot._id = root._id * 100 + root._snapshoted + 1
  root._snapshoted++
  return newSnapshot
}

function isRuntimeAttr(i) {
  return /^$$/.test(i)
}


/**
 * 启动Bus。Bus只有在启动以后，才可以fire事件，并且开始追踪调用栈。
 * @returns {*}
 */
Bus.prototype.start = function () {
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

Bus.prototype.restart = Bus.prototype.start

Bus.prototype.empty = function () {
  var root = this
  for (var i in root) {
    if (isRuntimeAttr(i)) {
      delete root[i]
    }
  }
}

/**
 * 调用栈初始化
 */
Bus.prototype.setTracker = function () {
  //set reference to root when start
  this.$$traceRoot = {module:'global',name:'global',stack : []}
  this.$$traceRef = this.$$traceRoot

}

/**
 * 往当前Bus里存或者取数据。
 * @param name 所存数据的名字，如果名字中有`.`，比如`user.name`，那么Bus会自动为你构造好对象结构。你可以继续用`user.age`存数据，用`user`一次性取出。
 * @param data
 * @returns {*}
 */
Bus.prototype.data = function( name, data){
  if( !this._started ){
    console.log("bus not started")
    return false
  }

  if( !name ) return this.$$data

  if( !data ){
    var ref = getRef( this.$$data, name)
//    console.log("[BUS] getting data", name, this.$$data, ref)
    return _.isObject(ref)?_.cloneDeep(ref):ref
  }else{
    if( this.opt.track){
      this.$$traceRef.data = {}
      setRef( this.$$traceRef.data, name, data)
    }
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

  var ns = name.split('.'),
    ref = obj,
    currentName

  while( currentName = ns.shift() ){
    if( ns.length == 0 ){
      if( _.isPlainObject(ref[currentName] )){
        _.merge(ref[currentName],data)
      }else{
        if( ref[currentName] !== undefined ) console.log("you are changing a exist data",name)
        ref[currentName] = data
      }

    }else{
      if( !_.isObject(ref[currentName])) {
        if( ref[currentName] !== undefined ) console.log("your data will be reset to an object",currentName)
        ref[currentName] = {}
      }
      ref = ref[currentName]
    }
  }

//  console.log("[BUS] setting done", name, obj)
}

/**
 * 设置当前使用Bus的模块名，主要用于和监听函数的函数名一起组成一个唯一的名字，之后就能通过这个名字来设置监听函数的顺序。
 * @param name
 * @returns {*|string}
 */
Bus.prototype.module = function( name ){
  if( !name ){
    return this.$$module
  }else{

    this.$$module = name
  }
}

/**
 * 注册监听器
 * @param {string} eventOrg 监听的事件名
 * @param {mix} listener 监听器对象，可以是一个函数，也可以是一个包含了模块名、函数名的对象。
 * @param {mix} opt 高级选项，可以主动屏蔽到其他监听器。可以指定当前触发器的执行顺序，例如最前或最后。
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
  var  res = {}, root = this

  if (typeof org == 'function') {
    res.module = root.$$module
    res.name = res.module + "."+(org.name || 'anonymous')
    res.function = org
  } else {
    if (Object.keys(org).length !== 1) {
      res = _.extend(res, org)
      res.module = res.module|| root.$$module
      res.name = res.module + "." + (res.name || (res.function&&res.function.name) || 'anonymous')
    } else {
      var key = Object.keys(org).pop()
      res.module = root.$$module
      res.name = res.module + "." + key
      res.function = org[key]
    }
  }
  res = _.defaults(res, opt)
  if (res.module !== this.$$module) {
    res.vendor = this.$$module
  }

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
 * 触发事件。
 * @param {string} eventOrg 事件名
 * @param {array} args 触发参数
 * @param {object} opt 高级选项，可以指定屏蔽某一事件或者只触发某一监听器。
 * @returns {object} promise object or array of results returned by listeners
 */
Bus.prototype.fire = function (opt) {

  if (!this._started) {
    console.log("[BUS] not started!")
    return false
  }

  var eventOrg = _.isObject(opt) ? opt.event : opt,
    args = _.toArray(arguments).slice(1)

  console.log("[BUS] firing :", eventOrg, 'bus id:', this._id)

  var caller = arguments.callee.caller.name

  var matchedEventStack = [ _.extend({arguments: []}, this.$$events || this._events)],
    eventNs = eventOrg.split(this.opt.nsSplit),
    root = this,
    results = {},
    firer = root.standardListener({module: root.module, name: caller}),
    firePromise = defer()

  root['$$results'] = root['$$results'] || {}
  opt = opt || {}
  args = args || []


  //runtime mute, will be clear when restart
  opt.mute && root.addMute(opt.mute, firer)

  if (eventOrg !== "") {
    matchedEventStack = getTargetStack(eventNs, matchedEventStack)
  }

  //will opt.cas to true, it will fire all children listeners
  if (opt.cas) {
    matchedEventStack = appendChildListeners(matchedEventStack)
  }

  //save current reference
  var currentRef = root.$$traceRef
  var currentEventRef
  if (root.opt.track) {
    //if fire in a promise callback, set the ref to right one
    //push current listeners to stack

    currentEventRef = {
      "name": eventOrg,
      "attached": matchedEventStack.map( function (matchedEvent ) {
        var matchedEventRecord = _.cloneDeep(matchedEvent)
        _.forEach( matchedEventRecord.listeners,function (listener) {
          listener.stack = []
        })
        return matchedEventRecord
      })}

    root.$$traceRef.stack.push(currentEventRef)
  }

  //fire
  var error = false
  forEachSeries(matchedEventStack, function (matchedEvent, i, nextEvent) {
    if( error ) return nextEvent(error);//break the loop

    forEachSeries(matchedEvent.listeners, function (listener, j, nextListener) {
      //set $$traceRef back

      var muteList = root.$$mute || root._mute
      if (muteList[listener.name] === undefined) {
        if (root.opt.track) {
          root.$$traceRef = currentEventRef.attached[i].listeners[j]

          root.$$traceRef.argv = matchedEvent.arguments.concat( cloneOwnProperties(args))

        }

        console.log("[BUS] applying :", eventOrg, listener.module, listener.name)
        debugger;
        var res = listener.function.apply(root.snapshot(), matchedEvent.arguments.concat(args))

        if (root.opt.track) {
          if (root.$$traceRef !== currentRef) root.$$traceRef = currentRef
          currentEventRef.attached[i].listeners[j].result = res
        }

        //save current result
        if( results[listener.name] ){
          if( !_.isArray( results[listener.name])){
            results[listener.name] = [results[listener.name]]
          }
          results[listener.name].push(res)
        }else{
          results[listener.name] = res
        }

        if( res instanceof  BusError ){
          console.error("[BUS] error: listener apply ",eventOrg, listener.name)
          error = res
          return nextListener(res)//break the loop

        }else if(util.isPromiseAlike(res) && res.block){

          res.then(function(){nextListener()})
          res.catch(nextListener)

        }else{

          nextListener()

        }
      }else{
        nextListener()
      }
    }, nextEvent)

  }, function allMatchedEventTriggered( err ){
    if( err ){
      console.log("[BUS] error", eventOrg)
      console.trace(err)
      return firePromise.reject( err )
    }
    firePromise.resolve(nestedBusPromise(results))
  })

  if(root['$$results'][eventOrg]){
    if( !_.isArray(root['$$results'][eventOrg])){
      root['$$results'][eventOrg] = [root['$$results'][eventOrg]]
    }
    root['$$results'][eventOrg].push( firePromise.promise)
  }else{
    root['$$results'][eventOrg] = firePromise.promise
  }

  //set it back
  if (root.opt.track)  root.$$traceRef = currentRef

  this._fired = true
  return firePromise.promise
}



Bus.prototype.fcall = function(   ){
  var root = this.snapshot(),
    args = _.toArray( arguments),
    eventOrg = args.shift(),
    fn = args.pop()


  var result = root.fire.apply( root,[eventOrg + ".before"].concat( args)).then( function(res){

    var result = fn.apply(root, args)
    if( util.isPromiseAlike(result) ){
      return result.then( function(){
        return root.fire.apply( root, [eventOrg + ".after" ].concat(args))
      })
    }else if( result instanceof BusError ){
      return Promise.reject(result)
    }else{
      return root.fire.apply( root, [eventOrg + ".after" ].concat(args))
    }
  })

  root['$$results'][eventOrg+".fcall"] = result

  return result
}


/************************/
/*  Promise extension   */
/************************/





function nestedBusPromise( obj ){

  return new Promise(function( resolve, reject){

    //1. resolve naive value
    if( !_.isObject(obj) || util.isPromiseAlike( obj )){
      resolve(obj)

      //2. reject immediate when error
    }else if( obj instanceof BusError ){
      reject( obj.status)

      //3. wait for child in object or array resolve
    }else{

      var handler = _.isArray(obj) ? 'all' :'props'

      resolve(Promise[handler](_.map(obj, function( child){
        return  nestedBusPromise(child)
      })))

    }
  })
}


function extractPromiseValue( values ){
  return _.mapValues( values, function(i){
    if( util.isPromiseAlike(i) ){
      return extractPromiseValue(i.value)
    }else if(_.isObject( i)){
      return extractPromiseValue(i)
    }else{
      return i
    }
  })
}

/**
 * 注册一个当前Bus内的所有任务执行完后的回调函数，主要用在Bus执行期间有异步任务的时候。
 * @param cb
 * @returns {*}
 */
Bus.prototype.then = function(cb){
  //TODO every time we call then, we create a new promise based on current $$result, better way to do this?


  var root = this

  var currentPromiseSnapshot = nestedBusPromise( root['$$results'] ).then(function( values ){
     return cb.call( root, extractPromiseValue( values ) )
  })

  root['$$results']['bus.then.:id'] = root['$$results']['bus.then.:id'] || {}
  root['$$results']['bus.then.:id']['bus.then.'+root._id] = root['$$results']['bus.then.:id']['bus.then.'+root._id] || []
  root['$$results']['bus.then.:id']['bus.then.'+root._id].push(currentPromiseSnapshot)


  return currentPromiseSnapshot
}

/**
 * 注册一个当前Bus内的所有任务失败完后的回调函数，主要用在Bus执行期间有异步任务的时候
 * @param cb
 * @returns {*}
 */
Bus.prototype.catch = function(cb){
  //TODO every time we call fail, we create a new promise based on current $$result, better way to do this?

  var root = this

  return nestedBusPromise( root['$$results'] ).catch(function( err ){
    return cb.call( root, err )
  })
}

function BusError(reason){
  _.extend(this,reason)
}

/**
 * 生成一个 error 对象，主要用于在执行过程中返回致命错误来阻止之后的事件继续触发。
 * @param status 状态码
 * @param error 错误信息
 * @returns {*}
 */
Bus.prototype.error = function( status, error ){
  console.log("[BUS] error", status, error)
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

function cloneOwnProperties(object){
  var cached = [object],
    cachedNamespace = ['root'],
    result = _.isArray(object) ? [] : {}

  ;(function _cloneOwnProperties(obj,result,namespace){
    _.forEach(obj,function(v,k){
      if(_.isObject(obj) && obj.hasOwnProperty &&!obj.hasOwnProperty(k)) return

      if( cached.indexOf( v) !== -1 ){
        result[k] = "{circular reference of "+cachedNamespace[cached.indexOf( v)]+"}"
      }else{
        if( _.isArray(v) || _.isObject(v)){
          cached.push(v)
          namespace.push(k)
          cachedNamespace.push(namespace.join('.') )
          if(_.isArray(obj)) k = result.length
          result[k] = _.isArray(v) ? [] : {}
          _cloneOwnProperties(v, result[k],namespace)
        }else if( !_.isFunction(v)){
          result[k] = v
        }
      }
    })
  })(object,result,[])

  return result
}


function defer() {
  var resolve, reject;
  var promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}

function forEachSeries(array, handler, callback  ){
  if( !_.isArray ){
    throw new Error("trying to use forEachSeries in non-array")
  }

  var root = this
  function next(i, err){
    if( err ) return callback&&callback(err)

    try{
      _.isUndefined(array[i]) ? (callback && callback()) : handler( array[i],i, next.bind(root,i+1) )
    }catch(e){
      callback && callback(e)
    }
  }

  next(0)
}




module.exports = Bus
