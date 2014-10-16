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
    if( msg instanceof Error){
      console.trace(msg.red)
    }else{
      console.log.apply(global,_.map(arguments, function(r){
        return _.isString(r) ? r.red : r
      }))
    }
  },
  "warn" : function( msg ){
    console.log.apply(global,_.map(arguments, function(r){
      return _.isString(r) ? r.yellow : r
    }))
  },
  banner : function(){
    console.log((function(){
//################################################################################
//     _____  _____   ____     ___      ____    _____      _      ____    _____
//    |__  / | ____| |  _ \   / _ \    / ___|  |_   _|    / \    |  _ \  |_   _|
//      / /  |  _|   | |_) | | | | |   \___ \    | |     / _ \   | |_) |   | |
//     / /_  | |___  |  _ <  | |_| |    ___) |   | |    / ___ \  |  _ <    | |
//    /____| |_____| |_| \_\  \___/    |____/    |_|   /_/   \_\ |_| \_\   |_|
//
//################################################################################
    }).toString().replace(/^(\/\/|function\s\(\){|\s*})/mg,'').cyan)
  }
}