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


    console.log("starting")

    options.port = options.port || 3000
    options.base = options.base || process.cwd()
    options.modulePath = options.modulePath || options.base + '/modules'

    //this._instance.use(cookieParser())
    //this._instance.use(compress())
    //this._instance.use(bodyParser.urlencoded({ extended: false }))
    //this._instance.use(bodyParser.json())
    //this._instance.use(multer({ dest: './uploads/'}))
    //this._instance.use( '/uploads', express.static( path.join(__dirname,'./uploads')) )


    //this._instance.engine('jade', require('jade').__express);
    //this._instance.engine('html', require('ejs').renderFile);
    //this._instance.engine('ejs', require('ejs').renderFile);
    //
    //this._instance.set('views', __dirname )



    return co(function *(){
        var modules = yield loadFn.call( app, options.modulePath)
        yield bootstrapFn.call( app, modules)

        logger.banner()
        logger.mlog("zero","listening",options.port)
        logger.warn("current environment : " + ( options.prod?"production":"development"))
        logger.log( "modules : ",Object.keys(modules).length, Object.keys(modules).join("|".cyan))
        app.listen( options.port )

    }).catch(function(err){
        logger.error( "Zero start failed")
        return console.log( JSON.stringify(err.stack, undefined, 2).replace(/\\n/g,"\n"))
        //return console.trace(err)
    })

}


module.exports = start



