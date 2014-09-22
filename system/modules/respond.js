var _ = require('lodash')

/**
 * 该模块负责自动将 bus.data('respond') 中的数据输出到浏览器端。
 * @module respond
 */
module.exports = {
  deps: ['request','model', 'bus'],
  route : {
    "*" : {
      "function" :function respondHandler( req, res, next){
//        if( req.isAgent && !req.isFirstAgent) return next && next()

        ZERO.mlog("respond"," respond default handler take action",req.bus._id,req.isAgent)

        //must wait all result resolved!
        console.log("register then first")
        req.bus.then(function(){
          console.log("excute first")
          return req.bus.fcall('respond.respond', {} , function(){
            var respond = req.bus.data('respond')

            if( !respond ){
              ZERO.mlog("respond"," NOTHING HAPPENED", req.bus._id )
              res.status(404)
              res.send("404")
            }else{
              ZERO.mlog("respond"," success respond")

              if( respond.file ){
                res.sendFile( respond.file)
              }else if( respond.page ){
                res.render( respond.page, respond.data||{})
              }else{
                res.json( respond.data || {} )
              }
            }
          })
        }).fail(function( err ){
          console.log(err)
          ZERO.error(err)
        })

//        if(req.isAgent) next&&next()

      },
      order : {last:true}
    }
  }
}