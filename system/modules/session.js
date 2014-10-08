var session = require('express-session')


module.exports = {
  sessionHandler : session({secret: 'zero meant to be rise from the bottom'}),
  init : function(){
    APP.use( this.sessionHandler)
  }
}