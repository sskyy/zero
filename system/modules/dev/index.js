var q = require('q'),
  path = require('path')

var request

module.exports =  {
  deps : ['statics','request'],
  init : function(){
    request = this.dep.request
  },
  route : {
    "/dev/simulate" : function (req, res){

      var url = req.body.url,
        method = req.body.method,
        data = req.body.data

      req.body = data

      request.triggerRequest( url, method , req, res, function(){})

      //all done
      req.bus.then(function(){
        res.json( req.bus.$$traceRoot )
      })

    }
  },
  statics : {
    "/dev": path.join(__dirname, './public')
  }
}
