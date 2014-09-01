var _ = require('lodash')

module.exports = {
  dependencies: ['request','model', 'bus'],
  respond: {},
  init: function (request, model) {
    var root = this

      //generate page for static page files

    //TODO
//      //generate model page for every
//      _.forEach(['get', 'post', 'delete','put'],function (method) {
//
//        var url = method.toUpperCase() + (method === 'post' ? ' /:model' : ' /:model/:id')
//
//        root.respond[url] = function (req, res ) {
//
//          //if it is a model request
//          if( req.param('model') && model.models[ req.param('model')] ){
//            req.bus.then(function () {
//              console.log("all end, sending respond",req.bus.data(), req.bus.$$results)
//              return res.json(req.bus.data())
//            })
//          }else{
//            return res.status(404).end()
//          }
//        }
//      })
  }
}