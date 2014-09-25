module.exports = {
  route : {
    daily : function(url){
      var module = this,
        key = makeKey(url),
        type = makeType(url)

      ZERO.mlog("statistic","daily log",url)
      return module.dep.model.models['statistic'].findOne({key:key,type:type}).then(function( record ){
        return record ?  module.dep.model.models['statistic'].update({key:key,type:type},{value:record.value+1}) :
          module.dep.model.models['statistic'].create({key:key,type:type,value:1})
      })

      function makeKey( url ){
        return url
      }

      function makeType(url){
        return [url, 'dailyView'].join('-')
      }
    }
  },
  listener : {
    feed : function(){
    }
  }
}