/**
 * Created by jiamiu on 14-9-18.
 */
module.exports ={
//  deps : ['model','rest','bus','respond'],
//  models : require("./models"),
//  listen : {},
//  route : {},
//  strategy : {
//    daily : function(){
//
//    },
//    feed : function(){
//
//    }
//  },
//  expand : function(module){
//    var root = this
//    if( module.strategy ){
//      _.extend( root.strategy, module.strategy)
//    }
//
//    if( module.statistics ){
//      _.forEach( module.statistics,function( handler, event){
//        if( event[0] == '/' ){
//          root.route[event] ? root.route[event].push(handler) : (root.route[event]=[handler])
//        }else{
//          root.listen[event] ? root.listen[event].push(handler) : (root.listen[event]=[handler])
//        }
//      })
//    }
//  },
//  bootstrap : function(){
//    this.listen = this.standardListeners( this.listen )
//    this.route = this.standardRoutes( this.routes )
//    this.dep.bus.expand(this)
//  },
//  standardListeners : function( listen ){
//    var root = this
//    return _.mapValues( listen, function( handlers ){
//      return function(){
//        var bus = this
//        var argv = _.toArray(arguments).slice(0)
//        _.forEach(handlers, function(handler){
//          if(_.isString(handler)&&root.strategy[handler]){
//            //use predefined handler
//            root.strategy[handler].apply(bus,argv)
//          }else if(_.isFunction(handler)){
//            //use custom handler
//            handler.apply(bus,argv)
//          }else{
//            ZERO.warn('statistic','unknown statistic handler')
//          }
//        })
//      }
//    })
//  },
//  standardRoutes : function( listen ){
//    var root = this
//    return _.mapValues( listen, function( handlers ){
//      return function(){
//        var bus = this
//        var argv = _.toArray(arguments).slice(0)
//        _.forEach(handlers, function(handler){
//          //TODO support verbose route handler
//          if(_.isString(handler)&&root.strategy[handler]){
//            //use predefined handler
//            root.strategy[handler].apply(bus,argv)
//          }else if(_.isFunction(handler)){
//            //use custom handler
//            handler.apply(bus,argv)
//          }else{
//            ZERO.warn('statistic','unknown statistic handler')
//          }
//        })
//      }
//    })
//  }
}