var schema = require('validate')

module.exports = function( module ){

  var validator = {
    login : schema( module.config.validator.login ),
    registry : schema( module.config.validator.registry )
  }

  return {
    'user.login' : function login( params ){
      console.log( "[USER]: on user.login",params )
      var root = this,
        errors = validator.login.validate( params )

      if( errors ) return root.error( 406, errors )

      return root.fire("user.findOne", params).then( function(){
        var user = _.clone( root.data('user.findOne') )
        delete user.password

        root.session.user = user
        root.data('respond', user)
      })
    },
    'user.register' : function registerUser( params ){
      var root = this,
        errors = validator.login.validate( params )

      if( errors ) return root.error( 406, errors )
      //We may verify invite code or something here
      return root.fire("user.create",params)
    },
    'user.logout' : function(){
      this.session.user = null
    }
  }
}

