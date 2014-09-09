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

require('./system/core/bootstrap')(app,{}, function(){
  console.log("==============================================")
  console.log("==============zero listening on 3000==========")
  console.log("==============================================")
  app.listen(3000)
})
