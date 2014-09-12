var agent = require('webkit-devtools-agent');
//agent.start()

var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  session = require('express-session')


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

require('./system/core/bootstrap')(app,{}, function(){
  console.log((function(){
//                       _oo0oo_
//                      o8888888o
//                      88" . "88
//                      (| -_- |)
//                      0\  =  /0
//                    ___/`---'\___
//                  .' \\|     |// '.
//                 / \\|||  :  |||// \
//                / _||||| -:- |||||- \
//               |   | \\\  -  /// |   |
//               | \_|  ''\---/''  |_/ |
//               \  .-\__  '-'  ___/-. /
//             ___'. .'  /--.--\  `. .'___
//          ."" '<  `.___\_<|>_/___.' >' "".
//         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
//         \  \ `_.   \_ __\ /__ _/   .-` /  /
//     =====`-.____`.___ \_____/___.-`___.-'=====
//                       `=---='
//
//
  }).toString().replace(/^(\/\/|function\s\(\){|\s*})/mg,''))
  console.log("==============zero listening on 3000=============")
  app.listen(3000)
})
