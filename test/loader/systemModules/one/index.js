/**
 * Created by jiamiu on 14-8-31.
 */
module.exports = {
  init : function(){
    console.log("one init called")
  },
  info : "this is one",
  expand : function( module ){
    module.tag ="tagged by one"
  }
}