var agent = require('webkit-devtools-agent');
//agent.start()


var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  session = require('express-session'),
  zero = require('./system/core/zero'),
  port = 3000,
  colors = require('colors')




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
  console.log((function(){
//################################################################################
//     _____  _____   ____     ___      ____    _____      _      ____    _____
//    |__  / | ____| |  _ \   / _ \    / ___|  |_   _|    / \    |  _ \  |_   _|
//      / /  |  _|   | |_) | | | | |   \___ \    | |     / _ \   | |_) |   | |
//     / /_  | |___  |  _ <  | |_| |    ___) |   | |    / ___ \  |  _ <    | |
//    /____| |_____| |_| \_\  \___/    |____/    |_|   /_/   \_\ |_| \_\   |_|
//
//################################################################################
  }).toString().replace(/^(\/\/|function\s\(\){|\s*})/mg,'').cyan)
  zero.mlog("zero","listening",port)
  app.listen(port)
})
