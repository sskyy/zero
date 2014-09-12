var _ = require('lodash'),
  q = require('q')

var nodes = {},
  indexes = {},
  nodeIndexMap = {},
  allIndex = []

function generateBeforeCreateCallback(indexName, nodeName, models) {
  return function (val) {

    if (!val[indexName]) return

    //TODO: validation
//      if( indexes[indexName].config.limit ){}
    console.log("++++++++++",indexName, JSON.stringify(val[indexName], null, 4))

    var index = models[indexName]
    return q.all( val[indexName].map(function ( inputIndex , key) {

      //may need to build index
      if (!inputIndex.id) {
        //same name check
        console.log("[INDEX] may create new ", inputIndex.name)
        return index.findOne({name: inputIndex.name}).then(function (i) {
          if (i) {
            console.log("[INDEX] not create new ", inputIndex.name)
            //to support query from browser.
            //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
            //TODO this does not working with multiple index like `tag`
            val[indexName+'.id'] = i.id
            val[indexName][key] = _.pick(i, ['id', 'name'])
            return val
          } else {
            console.log("[INDEX] create new ", inputIndex.name)

            return index.create(inputIndex).then(function (savedIndex) {
              //TODO provide config options to decide which field should be cached
              console.log("[INDEX] create new done ", inputIndex.name)

              //to support query from browser.
              //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
              val[indexName+'.id'] = savedIndex.id
              val[indexName][key] = _.pick(savedIndex, ['id', 'name'])
              return val
            })
          }
        })
      }else{
        console.log("[INDEX] not create new ", inputIndex.name)

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

  return function (val) {
    console.log( "[index] after create node")

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
  return function (val) {
    console.log( "[index] after create node")

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
            val[indexName+'.id'] = foundIndex.id
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

              //to support query from browser.
              //when using `category.id=2` from browser, waterline look for key name of 'category.id' to match query
              val[indexName+'.id'] = savedIndex.id
              val[indexName][key] = _.pick(savedIndex, ['id', 'name'])

              return val
            })
          }
        }).fail(function(err){
          console.log( err)
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



function setListener( root, indexName, nodeName, models){
  root.listen = root.listen || {}
  root.listen[nodeName + '.create.before'] = generateBeforeCreateCallback(indexName, nodeName, models)
  root.listen[nodeName + '.create.after'] = generateAfterCreateCallback(indexName,nodeName ,models)
  root.listen[nodeName + '.update.before']= generateBeforeUpdateCallback(indexName,nodeName, models)
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