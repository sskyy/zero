var agent = require('webkit-devtools-agent');
//agent.start()


var express = require('express'),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  session = require('express-session'),
  zero = require('./system/core/zero'),
  port = 3000,
  colors = require('colors'),
   argv = require('optimist').argv;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(multer({ dest: './uploads/'}))
app.use(session({secret: 'zero meant to be rise from the bottom'}))

app.engine('jade', require('jade').__express);
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').renderFile);

app.set('views', __dirname )

//save express ref to app
app.express = express

global['APP'] = app
global['ZERO'] = zero

require('./system/core/bootstrap')(app,{}, function(){
  zero.banner()
  zero.mlog("zero","listening",port)
  zero.warn("current environment : " + (argv.prod?"production":"development"))

  server.listen(port)

  if( !argv.prod){
    require('./system/core/dev')(server, app)
  }
})
