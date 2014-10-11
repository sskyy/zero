var   mockReq = require('mock-req'),
  mockRes = require('mock-res'),
  _ = require('lodash')

module.exports = {
//  deps : ['session','bus'],
//  io : require('socket.io').listen(SERVER),
//  socketListeners : {},
//  expand : function( module ){
//    var root = this
//    if( module.sockets ){
//      _.each( module.sockets, function( handler,eventWithNamespace  ){
//        var tmp = eventWithNamespace.split(":"),
//          event = tmp.pop(),
//          ns = tmp.pop() || "/"
//        root.socketListeners[ns] = root.socketListeners[ns] || {}
//        if( root.socketListeners[ns][event]){
//          root.socketListeners[ns][event].push(handler.bind(module))
//        }else{
//          root.socketListeners[ns][event] = [handler.bind(module)]
//        }
//        ZERO.mlog("socket", "adding listener", ns, event)
//
//      })
//    }
//  },
//  bootstrap : function(){
//    var root = this
//    _.forEach( root.socketListeners, function( eventsHandlers ,namespace ){
//      var io = namespace == "/" ? root.io : root.io.of( namespace)
//      io.on("connection", function( socket ){
//        var req = new mockReq({
//          url : namespace,
//          headers: socket.handshake.headers,
//          method : 'GET'
//        })
//        var res = new mockRes()
//
//        var sessionBuilt = function (){
//          socket.bus = socket.bus || root.dep.bus.bus.fork()
//          socket.bus.start()
//          socket.bus.session = function(name, data){
//            if( !data ) return req.session[name]
//            return req.session[name] = data
//          }
//          //you can still use session directly
//          socket.session = req.session
//
//          ZERO.mlog("socket","connected", socket.session)
//
//          //deal with each client msg
//          _.forEach( eventsHandlers, function(  handlers,event){
//            ZERO.mlog("socket","attaching event", event)
//
//            socket.on( event, function( msg ){
//              _.forEach( handlers, function(handler){
//                handler( msg, socket, io )
//              })
//            })
//          })
//          //use `res.end()` to commit session!
//          res.end()
//        }
//
//        delete req.session
//        root.dep.session.sessionHandler( req, res, sessionBuilt)
//      })
//    })
//  }
}