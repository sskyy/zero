/**
 * Created by jiamiu on 14-4-8.
 */

function isArray(obj){
  return Array.isArray? Array.isArray(obj):Object.prototype.toString.call(obj) == '[object Array]'
}

function createSVGElement( e,attr){
  var $el = Snap( document.createElementNS('http://www.w3.org/2000/svg', e) )
  return attr ? $el.attr(attr) : $el
}

function createSVGText( text ){
  var $text = createSVGElement('text');
  $text.node.innerHTML=text;
  Snap('svg').append($text);
  $text.data('width',$text.getBBox().width);
  return $text.remove()
}


function createFnRect($t,attr){
  var $g = createSVGElement('g').attr('class','fnRect'),
    $r = createSVGElement('rect', $.extend({
      x:0,
      y:0,
      fill:FILL
    },attr))

  $t.attr({x:PADDING/2,y:TEXT_FIX})

  return $g.append( $r).append($t)
}

function tranStr( obj ){
  return 'translate('+obj.x+','+obj.y+')'
}

function iteratorLast( obj, branch, fn,ctx ){
  ctx = ctx||this
  var end = false,
    children

  if( isArray(branch) ){
    if( !branch.every(function(b){ if( eval('obj.'+b) !== undefined) return true})) end= true
  }else{
    if( eval('obj.'+b) === undefined ) end = true
  }

  if( end ){
    return fn.call(ctx,obj,undefined)

  }else {

    children = isArray(branch) ?
      branch.map(function (b) {
        return callIterator( eval('obj.'+b), branch,fn,ctx)
      }) :
      callIterator( eval('obj.'+branch,branch,fn,ctx))

    return  fn.call(ctx, obj, children)
  }

  function callIterator(obj, branch ,fn,ctx){
    var x = eval('obj.' + branch),
      childrenRes = isArray(x) ? [] : {}

    forEach( x,function( e, i){
      childrenRes[i] = iterator(c, branch, fn, ctx)
    })

    return childrenRes
  }

}

function buildTree( data, children){

}

function forEach( object, iterator ){
  if( Object.prototype.toString.call(object) == '[object Array]'){
    return object.forEach(iterator)
  }

  for(var i in object){
    iterator.call( object[i], object[i], i)
  }
}

$(function(){
  $.ajax({
    url : '/dev/events',
    success : function(data){
      var $g = createSVGElement('g'),
        $diagram = iteratorLast({"/":data},['str','reg'],buildTree,$g)

      console.log($diagram)
    }
  })
})
