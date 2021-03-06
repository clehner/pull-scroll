var pull = require('pull-stream')
var Pause = require('pull-pause')
var isVisible = require('is-visible').isVisible

function isBottom (scroller, buffer) {
  var rect = scroller.getBoundingClientRect()
  var topmax = scroller.scrollTopMax || (scroller.scrollHeight - rect.height)
  return scroller.scrollTop >=
    + ((topmax) - (buffer || 0))
}

function isTop (scroller, buffer) {
  return scroller.scrollTop <= (buffer || 0)
}

function isFilled(content) {
  return (
    !isVisible(content)
    //check if the scroller is not visible.
   // && content.getBoundingClientRect().height == 0
    //and has children. if there are no children,
    //it might be size zero because it hasn't started yet.
//    &&
    && content.children.length > 10
    //&& !isVisible(scroller)
  )
}

function isEnd(scroller, buffer, top) {
  //if the element is display none, don't read anything into it.
  return (top ? isTop : isBottom)(scroller, buffer)
}

function append(list, el, top, sticky) {
  if(!el) return
  var s = list.scrollHeight
  if(top && list.firstChild)
    list.insertBefore(el, list.firstChild)
  else
    list.appendChild(el)

  //scroll down by the height of the thing added.
  //if it added to the top (in non-sticky mode)
  //or added it to the bottom (in sticky mode)
  if(top !== sticky) {
    var st = list.scrollTop, d = (list.scrollHeight - s) + 1
    list.scrollTop = list.scrollTop + d
//    list.scrollTo(
//      list.scrollLeft,
//      list.scrollTop + d
//    )
  }
}

function overflow (el) {
  return el.style.overflowY || el.style.overflow || (function () {
    var style = getComputedStyle(el)
    return style.overflowY || el.style.overflow
  })()
}

var buffer = 100
module.exports = function Scroller(scroller, content, render, top, sticky, cb) {
  //if second argument is a function,
  //it means the scroller and content elements are the same.
  if('function' === typeof content) {
    cb = sticky
    top = render
    render = content
    content = scroller
  }

  var f = overflow(scroller)
  if(!/auto|scroll/.test(f))
    throw new Error('scroller.style.overflowY must be scroll or auto, was:' + f + '!')
  scroller.addEventListener('scroll', scroll)
  var pause = Pause(function () {}), queue = []

  //apply some changes to the dom, but ensure that
  //`element` is at the same place on screen afterwards.

  function add () {
    if(queue.length)
      append(content, render(queue.shift()), top, sticky)
  }

  function scroll (ev) {
    if (isEnd(scroller, buffer, top) || isFilled(content)) {
      pause.resume()
      add()
    }
  }

  return pull(
    pause,
    pull.drain(function (e) {
      queue.push(e)

      if(!isVisible(content)) { if(content.children.length < 10) add() }
      else if(isEnd(scroller, buffer, top)) add()

      if(queue.length > 5) pause.pause()
    }, function (err) {
      if(cb) cb(err)
      else if(err) console.error(err)
    })
  )
}













