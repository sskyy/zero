var config = require('./config')


module.exports = {
  models : require('./models'),
  listen : require('./listen')(config),
  //this will allow app global config overwrite
  config : config,
  route : {
    "*" : {
      "function" : function initSession(req,res,next){
        req.session.user = {}
        next()
      },
      "order" : {first:true}
    }
  }
}


