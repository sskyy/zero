/**
 * Created by jiamiu on 14-9-12.
 */
var _ = require('lodash')

function orderedCollection(){
  this._collection = []
}

orderedCollection.prototype.push = function( item, key, order){

  var obj = _.zipObject( ['item','key','order'],[item,key,order])
  var index,rest

  if( order ){
    if( order.last ){
      this._collection.push( obj )
    }else if( order.first){
      this._collection.unshift( obj )
    }else if( order.before){
      index = _.findIndex( this._collection, function(i){
        return i.key == order.before
      })
      if( index == -1 ){
        this._collection.push(obj)
      }else {
        rest = this._collection.splice(index)
        this._collection = this._collection.concat(obj, rest)
      }
    }else if( order.after){
      index = _.findIndex( this._collection, function(i){
        return i.key == order.before
      })
      if( index == -1 ){
        this._collection.push(obj)
      }else {
        rest = this._collection.splice(index + 1)
        this._collection = this._collection.concat(obj, rest)
      }
    }
  }else{
    index = _.findIndex( this._collection, function(i){
      return i.order && i.order.last
    })
    if( index == -1 ){
      this._collection.push(obj)
    }else{
      rest = this._collection.splice( index )
      this._collection = this._collection.concat( obj, rest)
    }
  }

}

orderedCollection.prototype.forEach = function( callback ){
  return this._collection.forEach(function( obj ){
    callback( obj.item)
  })
}

module.exports = orderedCollection