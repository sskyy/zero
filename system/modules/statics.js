var _ = require("lodash")

/**
 * 如果某一依赖次某块的上层模块声明了statics属性，那么则为其提供静态文件服务。
 * @module statics
 *
 */
module.exports = {
  /**
   * 扩展声明了 statics 属性的模块。
   * @param module
   * @example
   * //module expand on statics example
   * {
   *  deps : ['statics'],
   *  statics : {
   *   '/URL' : 'FILE_PATH'
   *  }
   * }
   */
  expand : function( module ){
    var root = this
    if( module.statics ){
      _.forEach( module.statics, function( path, prefix){
        ZERO.mlog("statics", "expand:", prefix, path)
        APP.use( prefix, APP.express.static( path) )
      })
    }
  }
}