var _ = require('lodash')

var rbac = {
  deps : ['bus','request','model'],
  models : require('./models'),
  acl : {
    roles : {},
    routes : {}
  },
  route : {},
  expand : function( module ){
    if( module.acl ){
      _.extend( rbac.acl.roles, module.acl.roles )
      _.extend( rbac.acl.routes, module.acl.routes)
    }
  },
  bootstrap : {
    "function" : function(){
      this.dep.request.add( '*', rbac.applyRoleToCurrentUser, {after:'user.initSession'})

      this.extendRoute()
      this.dep.request.expand(this)

    },
    "order" : {"before":"request.bootstrap"}
  },
  applyRoleToCurrentUser : function applyRoleToCurrentUser(req, res,next){

    var  rolesToApply = Object.keys( rbac.acl.roles )

    applyNext(0)

    function applyNext( n ){
      if( !rolesToApply[n] ){
        return next()
      }

      var applyResult = rbac.acl.roles[rolesToApply[n]]( req )
      if( applyResult && applyResult.then ){
        applyResult.then(function(){
          req.session.user.roles = req.session.user.roles || []
          req.session.user.roles.push( rolesToApply[n] )
        }).fin(function(){
          applyNext(++n)
        })
      }else if(applyResult===true){
          req.session.user.roles = req.session.user.roles || []
          req.session.user.roles.push( rolesToApply[n] )
          applyNext(++n)
      }else{
        applyNext(++n)
      }
    }
  },
  extendRoute : function(){
    rbac.route = _.mapValues( this.acl.routes, function( rolesNeeded ){
      return {
        "function": function checkRole(req, res, next) {
          _.intersection(req.session.user.roles, rolesNeeded).length == rolesNeeded.length ?
            next() :
            res.status(403).end()

          console.log(rolesNeeded,req.session.user.roles)
        },
        "order" : {after:'rbac.applyRoleToCurrentUser'}
      }
    })
  }
}

module.exports = rbac