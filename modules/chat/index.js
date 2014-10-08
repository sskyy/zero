module.exports = {
  dep : ['socket'],
  sockets : {
    'join' : function( roomName, socket){
      socket.session.room = roomName
      socket.emit("ok")
    },
    "say" : function( msg, socket){
      console.log( "getting current name", socket.session.room )
      socket.emit("ok2")
    }
  }
}