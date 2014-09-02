var express = require('express'),
  app = express(),
  bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


//save express ref to app
app.express = express

require('./system/core/bootstrap')(app,{}, function(){
  console.log("==============================================")
  console.log("==============zero listeng on 3000============")
  console.log("==============================================")
  app.listen(3000)
})
