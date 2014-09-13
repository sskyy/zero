var   colors = require('colors'),
  _ = require('lodash')


module.exports = {
  "log" : console.log.bind(global),
  "mlog" : function(  ){
    var argv = _.toArray(arguments).slice(0)
    argv[0] = (argv[0][0].toUpperCase() + argv[0].slice(1).toLowerCase())+ " :: ".green
    console.log.apply( global, argv)
  },
  "debug" : function( msg ){
    console.log.apply(global,_.map(arguments, function(r){
      return _.isString(r) ? r.blue : r
    }))
  },
  "info" : function( msg ){
    console.log.apply(global,_.map(arguments, function(r){
      return _.isString(r) ? r.green : r
    }))
  },
  "error" : function( msg ){
    console.log.apply(global,_.map(arguments, function(r){
      return _.isString(r) ? r.red : r
    }))
  },
  "warn" : function( msg ){
    console.log.apply(global,_.map(arguments, function(r){
      return _.isString(r) ? r.yellow : r
    }))
  }
}