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
        req.bus.then(function(){
          ZERO.mlog("respond","respond bus.then execute ")
            var respond = req.bus.data('respond')

            if( !respond ){
              ZERO.mlog("respond"," NOTHING HAPPENED", req.bus._id )
              res.status(404).send("404")
            }else{
              ZERO.mlog("respond"," <---------------begin to respond-------------->",respond.file,respond.page)

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
        }).catch(function( err ){
          ZERO.error("respond last handler error",err)
          res.status(err.status || 500).json({errors: req.bus.$$error })
        })

//        if(req.isAgent) next&&next()

      },
      order : {last:true}
    }
  }
}