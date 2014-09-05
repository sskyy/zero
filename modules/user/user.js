var config = require('./config')


module.exports = {
  models : require('./models'),
  listen : require('./listen')(config),
  //this will allow app global config overwrite
  config : config
}


