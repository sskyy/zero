module.exports = {
  "route" : {
    "/upload" : function( req, res ){
      res.send( req.files )
    }
  }
}