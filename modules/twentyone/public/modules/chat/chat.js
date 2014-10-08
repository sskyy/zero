var socket = io.connect('http://127.0.0.1:3000');

socket.on('connect', function () {
  socket.on('ready', function () {
  });
  console.log('Connected !');
  console.log("emit join")

  socket.emit("join", function(){
    console.log("emit join")
    socket.emit("chat")
    console.log("emit chat")

  })
});