var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  session = require('express-session')


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(multer({ dest: './uploads/'}))
app.use(session({secret: 'zero meant to be rise from the bottom'}))



//save express ref to app
app.express = express

require('./system/core/bootstrap')(app,{}, function(){
  console.log("==============================================")
  console.log("==============zero listening on 3000==========")
  console.log("==============================================")
  app.listen(3000)
})
