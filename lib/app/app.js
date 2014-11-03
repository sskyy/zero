var express = require('express'),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  zero = require('./system/core/zero'),
  colors = require('colors'),
  argv = require('optimist').argv,
  port = argv.port || 3000,
  path = require('path'),
  compress = require('compression');

app.use(compress());
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
app.modules = []

global['APP'] = app
global['ZERO'] = zero
global['SERVER'] = server

require('./system/core/bootstrap')({ modulePath : argv.modulePath, app:app, server:server}, function( err, modules ){
  if( err ){
    zero.error( "bootstrap failed, due to", err)
    return console.trace(err)
  }

  zero.banner()
  zero.mlog("zero","listening",port)
  zero.warn("current environment : " + (argv.prod?"production":"development"))
  console.log( "modules : ",Object.keys(modules).length, Object.keys(modules).join("|".cyan))

  server.listen(port)
})
