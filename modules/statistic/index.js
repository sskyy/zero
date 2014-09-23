var _ = require('lodash'),
  moment = moment = require('moment')

module.exports ={
  deps : ['model','rest','bus','respond','request'],
  models : require("./models"),
  listen : {},
  route : {},
  strategy : require('./strategy'),
  expand : function(module){
    var root = this
    if( module.statistics.strategy ){
      _.merge( root.strategy, module.statistics.strategy)
    }

    if( module.statistics.log ){
      _.forEach( module.statistics.log,function( handler, event){
        if( /^[GPD\/]/.test(event) ){
          root.route[event] ? root.route[event].push(handler) : (root.route[event]=[handler])
        }else{
          root.listen[event] ? root.listen[event].push(handler) : (root.listen[event]=[handler])
        }
      })
    }
  },
  bootstrap : {
    "function" : function(){
      this.listen = this.standardListeners( this.listen )
      this.route = this.standardRoutes( this.route )
      this.dep.bus.expand(this)
      this.dep.request.expand(this)
    },
    "order" : {"before":"request.bootstrap"}
  },
  standardListeners : function( listen ){
    var root = this
    return _.mapValues( listen, function( handlers, event ){
      return function(){
        var bus = this
        var argv = _.toArray(arguments).slice(0)
        _.forEach(handlers, function(handler){
          if(_.isString(handler)&&root.strategy.listener[handler]){
            //use predefined handler
            root.strategy.listener[handler].apply(bus,[event].concat(argv))
          }else{
            ZERO.warn('statistic','unknown statistic handler')
          }
        })
      }
    })
  },
  standardRoutes : function( listen ){
    var root = this
    return _.mapValues( listen, function( handlers, url ){
      return {
        "function":function(req, res, next ){
          ZERO.mlog("statistic","log",url)

          applyNext(0)

          function applyNext( n ){
            if( !handlers[n] ){
              return next()
            }

            var applyResult = root.strategy.route[handlers[n]].call( root, url, req )
            if( applyResult && applyResult.then ){
              applyResult.fin(function(){
                applyNext(++n)
              })
            }else{
              applyNext(++n)
            }
          }

        },
        "order" : {first:true}
      }
    })
  }
}