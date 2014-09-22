/**
 * Created by jiamiu on 14-9-12.
 */
var _ = require('lodash')

function orderedCollection(){
  this._collection = {}
  this.head = null
  this.tail = null
  this._waitingForOrder = {}
  this.length = 0

}

function linkAfter ( obj1, obj2 ){
  if( !obj1 || !obj2 ) return
  obj2.prev = obj1

  if( obj1.next ){
    obj2.next = obj1.next
    obj2.next.prev = obj2
  }

  obj1.next = obj2
}

function linkBefore ( obj1, obj2){
  if( !obj1 || !obj2 ) return

  obj2.next = obj1
  if( obj1.prev ){
    obj2.prev = obj1.prev
    obj2.prev.next = obj2
  }

  obj1.prev = obj2
}

orderedCollection.prototype.store = function(obj){
  if( this._collection[obj.key] === obj ) return

  if( this._collection[obj.key]){
    //make it an array. don't worry, the chain will still work.
    !_.isArray( this._collection[obj] ) && (this._collection[obj] = [this._collection[obj]])
    this._collection[obj].push(obj)
  }else{
    this._collection[obj.key] = obj
  }

  if( this._waitingForOrder[obj.key] ){
    this._waitingForOrder[obj.key].forEach(function(waitingObj){
      if( waitingObj.before ){
        linkBefore( obj )
      }else if( waitingObj.after ){
        linkAfter(obj)
      }else{
        console.log("you put wrong obj in waiting collection",obj)
      }
    })
    delete this._waitingForOrder[obj.key]
  }

  this.length ++
  this.resetHeadAndTail()
}

orderedCollection.prototype.resetHeadAndTail = function(){
  if( this.length ==  1 ){
    this.head = this._collection[Object.keys(this._collection)[0]]
    this.tail = this._collection[Object.keys(this._collection)[0]]
  }else{
    while( this.head.prev){
      this.head = this.head.prev
    }
    while( this.tail.next){
      this.tail = this.tail.next
    }
  }
}


orderedCollection.prototype.append = function( obj ){
  linkAfter( this.tail, obj)
  this.store(obj)
}

orderedCollection.prototype.prepend = function( obj ){
  linkBefore( this.head, obj)
  this.store(obj)
}

orderedCollection.prototype.before = function( obj, who ){

  if(_.isArray(this._collection[who])){
    throw new Error("err you are trying to insert an object before a collection!")
  }else if( this._collection[who] ){
    linkBefore(this._collection[who], obj)
  }else{
    this._waitingForOrder[who] = this._waitingForOrder[who] || []
    this._waitingForOrder[who].push(obj)
  }

  this.store(obj)
}

orderedCollection.prototype.after = function( obj, who ) {
  this.store(obj)

  if(_.isArray(this._collection[who])){
    throw new Error("you are trying to insert an object after a collection!")
  }else if( this._collection[who] ){
    linkAfter(this._collection[who], obj)
    if( this.tail === this._collection[who] ){
      this.tail = obj
    }
  }else{
    this._waitingForOrder[who] = this._waitingForOrder[who] || []
    this._waitingForOrder[who].push(obj)
  }

  this.store(obj)
}

orderedCollection.prototype.push = function( item, key, order){
  var obj = _.zipObject( ['item','key','order'],[item,key,order])

  if( !order ){

    this.append( obj )

  }else if( order.first ){
    this.prepend( obj )
  }else if( order.last){
    this.append(obj)
  }else if( order.before){
    this.before( obj, order.before)
  }else if( order.after ){
    this.after( obj, order.after )
  }
}

orderedCollection.prototype.forEach = function( callback ){
  var i  = this.head
  while( i ){
    callback(i.item)
    i = i.next || false
  }
}

module.exports = orderedCollection