var schema = require('validate'),
  _ = require('lodash')

module.exports = function( config ){


  var validator = {
    login : schema( config.validator.login ),
    registry : schema( config.validator.registry )
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
        errors = validator.registry.validate( params )

      if( errors.length ) return root.error( 406, errors )
      //We may verify invite code or something here
      return root.fire("user.create",params).then(function(){
        var user = _.clone( root.data('user.create') )
        delete user.password

        root.session.user = user
        root.data('respond', user)
      })
    },
    'user.logout' : function(){
      this.session.user = null
    }
  }
}

