var agent = require('webkit-devtools-agent');
//agent.start()


var express = require('express'),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  zero = require('./system/core/zero'),
  port = 3000,
  colors = require('colors'),
  argv = require('optimist').argv,
  path = require('path');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(multer({ dest: './uploads/'}))
app.use( '/uploads', express.static( path.join(__dirname,'./uploads')) )


app.engine('jade', require('jade').__express);
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').renderFile);

app.set('views', __dirname )

//save express ref to app
app.express = express

global['APP'] = app
global['ZERO'] = zero
global['SERVER'] = server

require('./system/core/bootstrap')(app,{}, function(){
  zero.banner()
  zero.mlog("zero","listening",port)
  zero.warn("current environment : " + (argv.prod?"production":"development"))

  server.listen(port)

  if( !argv.prod){
    require('./system/core/dev')(server, app)
  }
})
