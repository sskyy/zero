var q = require('q')

var admin = {
  deps : ['rbac', 'model','statistic'],
  acl : {
    routes :{
//      'GET /post' : ['loggedIn'],
//      'GET /post/:id' : ['owner']
    },
    roles : {
      loggedIn : function(req){
        return req.session.user && req.session.user.id
      },
      anonymous : function(req){
        return !req.session.user || !req.session.user.id
      },
      owner : function(req){
        var tmp = req.path.slice(1).split("/"),
          modelName = tmp[0],
          id = tmp[1]

        if( !modelName || !id || !admin.dep.model.models[modelName]){
          return false
        }

        return q.Promise(function( resolve, reject){
          admin.dep.model[modelName].findOne(id).then(function(model){
            if( model && model.user && model.user.id == req.session.user.id ){
              resolve()
            }else{
              reject()
            }
          }).fail(reject)
        })
      }
    }
  },
  statistics : {
    log : {
      'GET *' : 'daily'
    }
  }
}

module.exports = admin