var _ = require('lodash')


module.exports = {
  deps : ['request','model'],
  files : {},
  expand : function( module ){
    var root = this
    if( module.models ){
      //allow upload
      _.forEach( module.models ,function(model){
        if( model.isFile ){
          root.files[model.identity] = model
          root.dep.request.add('POST /'+model.identity, function handlerFileUpload(req,res, next){
            req.body = _.isObject( req.body) ? req.body : {}
            _.extend( req.body, _.values(req.files).pop())
            next()
          },{first:true})
        }
      })
    }
  }
}