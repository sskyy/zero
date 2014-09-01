var express = require('express'),
  app = express(),
  bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


require('./system/core/bootstrap')(app,{}, function(){
  console.log("zero listeng on 3000")
  app.listen(3000)
})
