var   mockReq = require('mock-req'),
  mockRes = require('mock-res'),
  _ = require('lodash')

module.exports = {
  deps : ['session','bus'],
  io : require('socket.io').listen(SERVER),
  socketListeners : {},
  expand : function( module ){
    var root = this
    if( module.sockets ){
      _.each( module.sockets, function( handler,eventWithNamespace  ){
        var tmp = eventWithNamespace.split(":"),
          event = tmp.pop(),
          ns = tmp.pop() || "/"
        root.socketListeners[ns] = root.socketListeners[ns] || {}
        if( root.socketListeners[ns][event]){
          root.socketListeners[ns][event].push(handler.bind(module))
        }else{
          root.socketListeners[ns][event] = [handler.bind(module)]
        }
        ZERO.mlog("socket", "adding listener", ns, event)

      })
    }
  },
  bootstrap : function(){
    var root = this
    _.forEach( root.socketListeners, function( eventsHandlers ,namespace ){
      var io = namespace == "/" ? root.io : root.io.of( namespace)
      io.sockets.on("connection", function( socket ){
        console.log("==================>on socket connect")
        //you can still use session directly

        //deal with each client event
        _.forEach( eventsHandlers, function(  handlers,event){
          ZERO.mlog("socket","attaching event", event)

          socket.on( event, function( msg, cb ){
            var req = new mockReq({
              url : namespace,
              headers: socket.handshake.headers,
              method : 'GET'
            })
            var res = new mockRes()

            delete req.session

            root.dep.session.sessionHandler( req, res, function aftersessionBuilt(){


              socket.bus = socket.bus || root.dep.bus.bus.fork()
              socket.bus.session = function(name, data){
                if( !data ) return req.session[name]
                return req.session[name] = data
              }
              socket.bus.start()
              socket.session = req.session

              ZERO.mlog("socket", "answering requrest", event, msg)
              _.forEach( handlers, function(handler){
                handler(msg ,socket, io )
              })

              //use `res.end()` to commit session!
              res.end()
            })
          })
        })
      })
    })
  }
}