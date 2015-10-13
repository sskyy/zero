var koa = require('koa'),
    http = require("http"),
    bodyParser = require('body-parser'),
    color = require('colors'),
    co = require('co'),
    logger = require('./logger'),
    path = require('path'),
    loadFn = require('./load'),
    bootstrapFn = require('./bootstrap')

function start(options){
    var app =  koa()
    app.logger = logger

    console.log("Zero.js starting...")

    options.port = options.port || 3000
    options.base = options.base || process.cwd()
    options.modulePath = options.modulePath || options.base + '/modules'


    return co(function *(){
        var modules = yield loadFn.call( app, options.modulePath)
        yield bootstrapFn.call( app, modules)

        logger.banner()
        logger.mlog("zero","listening", options.port)
        logger.warn("current environment : " + ( options.prod?"production":"development"))
        logger.log( "modules : ",Object.keys(modules).length, Object.keys(modules).join("|".cyan))
        app.listen( options.port )

        app.on('error', function(err, ctx){
            console.error('server error', err, ctx);
        });

    }).catch(function(err){
        logger.error( "Zero start failed")
        return console.log( JSON.stringify(err.stack, undefined, 2).replace(/\\n/g,"\n"))
    })

}


module.exports = start



