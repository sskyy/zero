var _ = require('lodash'),
  q = require('q')

var nodes = {},
  indexes = {}

function generateBeforeCreateCallback(indexName, nodeName, models) {
  return function handlerIndexBeforeNodeCreate(val) {

    if (!val[indexName]) return

    //TODO: validation
//      if( indexes[indexName].config.limit ){}

    var index = models[indexName]
    return q.all( val[indexName].map(function ( inputIndex , key) {

      //may need to build index
      if (!inputIndex.id) {
        //same name check
        ZERO.mlog("index"," may create new ", inputIndex.name)
        return index.findOne({name: inputIndex.name}).then(function (i) {
          if (i) {
            ZERO.mlog("index"," not create new ", inputIndex.name)
            //to support query from browser.
            //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
            //TODO this does not working with multiple index like `tag`
            val[indexName][key] = _.pick(i, ['id', 'name'])
            return val
          } else {
            ZERO.mlog("index"," create new ", inputIndex.name)

            return index.create(inputIndex).then(function (savedIndex) {
              //TODO provide config options to decide which field should be cached
              ZERO.mlog("index"," create new done ", inputIndex.name)

              //to support query from browser.
              //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
              val[indexName][key] = _.pick(savedIndex, ['id', 'name'])
              return val
            })
          }
        })
      }else{
        ZERO.mlog("index"," not create new ", inputIndex.name)

        val[indexName][key] = _.pick(inputIndex, ['id', 'name'])

        //to support query from browser.
        //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
        val[indexName+'.id'] = index.id
        return val
      }
    }).filter(q.isPromise))
  }
}

function generateAfterCreateCallback(indexName, nodeName, models) {

  return function handlerIndexAfterNodeCreate(val) {
    ZERO.mlog( "index"," after create node")

    if (!val[indexName]) return
    var index = models[indexName]
    return q.all( val[indexName].map(function ( inputIndex, key) {
      //need to push nodes
      return index.findOne( inputIndex.id).then(function( foundIndex){
        var nodes = foundIndex.nodes || {}
        if( !nodes[nodeName] ) nodes[nodeName] = {}

        //TODO we need to improve this, because the 'nodes' field may grow very big
        nodes[nodeName][val.id] = _.pick(val,['id','title'])

        return index.update(foundIndex.id, {nodes: nodes})
      })
    }).filter(q.isPromise))
  }
}

function generateBeforeUpdateCallback(indexName,nodeName, models) {
  return function handlerIndexBeforeNodeUpdate(val) {
    ZERO.mlog( "index"," after create node")

    if (!val[indexName]) return

    //TODO: validation
//      if( indexes[indexName].config.limit ){}
    var index = models[indexName]
    return q.all( val[indexName].map(function (inputIndex, key) {


      //may need to build index
      if (!inputIndex.id) {
        //same name check
        return index.findOne({name: inputIndex.name}).then(function (foundIndex) {
          if (foundIndex) {

            //to support query from browser.
            //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
            //TODO : this do not support multiple index
            val[indexName][key] = _.pick(foundIndex, ['id', 'name'])

            var nodes = foundIndex.nodes || {}
            if( !nodes[nodeName] ) nodes[nodeName] = {}

            //TODO we need to improve this, because the 'nodes' field may grow very big
            nodes[nodeName][val.id] = _.pick(val,['id','title'])

            return index.update(foundIndex.id, {nodes: nodes})

          } else {

            inputIndex.nodes = {}
            inputIndex.nodes[nodeName] = {}
            inputIndex.nodes[nodeName][val.id] = _.pick(val,['id','title'])

            return index.create(inputIndex).then(function (savedIndex) {
              //TODO provide config options to decide which field should be cached

              //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
              val[indexName][key] = _.pick(savedIndex, ['id', 'name'])

              return val
            })
          }
        }).fail(function(err){
          ZERO.error( err)
        })
      }else{
        val[indexName][key] = _.pick(index, ['id', 'name'])

        //to support query from browser.
        //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
        val[indexName+'.id'] = index.id
        //TODO update index.nodes
        return val
      }
    }).filter(q.isPromise) )
  }
}

function generateBeforeModelFindHandler( indexName, nodeName, models){
  return {
    "function": function convertQueryWithDotToObject( val ){
      _.forEach(val, function( v, k){
        if( (new RegExp("^"+indexName+"\\.")).test(k) ){
          console.log("has dot",indexName,k)
          var obj = {}, i= obj,stack = k.split("."),n
          while( n = stack.shift() ){
            if( stack.length !== 0){
              i[n] = {}
              i= i[n]
            }else{
              i[n] = v
            }
          }
          _.extend(val,obj)
          delete val[k]
        }else{
          val[k] = v
        }
      })
    },
    "first" : true
  }
}


function setListener( root, indexName, nodeName, models){
  root.listen = root.listen || {}
  root.listen[nodeName + '.create.before'] = generateBeforeCreateCallback(indexName, nodeName, models)
  root.listen[nodeName + '.create.after'] = generateAfterCreateCallback(indexName,nodeName ,models)
  root.listen[nodeName + '.update.before']= generateBeforeUpdateCallback(indexName,nodeName, models)

  //before find
  root.listen[nodeName+'.find'] = generateBeforeModelFindHandler( indexName, nodeName, models)
}

module.exports = {
  deps : ['model','bus'],
  indexes : {},
  expand : function( module ){
    var root = this
    if( module.models ){
      module.models.forEach(function( model ){
        if( model.isIndex ){
          root.indexes[model.identity] = model.attributes
        }
      })
    }
  },
  bootstrap : function( ){
    var root = this

    _.forEach(root.dep.model.models, function(node, nodeName){
      if( node.isNode ){
        _.forEach( root.indexes , function( attributes, indexName ){
          setListener( root, indexName, nodeName, root.dep.model.models )
        })
      }
    })
    root.dep.bus.expand(root)

  }
}