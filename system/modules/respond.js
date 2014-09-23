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

        ZERO.mlog("respond"," respond default handler take action","isAgent:",req.isAgent)

        //must wait all result resolved!
        console.log("respond bus.then register!!!",req.bus['$$results'])
        req.bus.then(function(){
          console.log("respond bus.then execute ")
            var respond = req.bus.data('respond')

            if( !respond ){
              ZERO.mlog("respond"," NOTHING HAPPENED", req.bus._id )
              res.status(404)
              res.send("404")
            }else{
              ZERO.mlog("respond"," success respond")

              if( respond.file ){
                return req.bus.fire('respond.file.before', respond).then(function(){
                  res.sendFile( respond.file)
                })
              }else if( respond.page ){
                return req.bus.fire('respond.page.before', respond).then(function() {
                  res.render(respond.page, respond.data || {})
                })
              }else{
                return req.bus.fire('respond.data.before', respond).then(function() {
                  res.json(respond.data || {})
                })
              }
            }
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