const test = require('tape')
const async = require('async')
const HistoryTree = require('./index.js')


test('flat commit', function(t){
  t.plan(4)

  var history = new HistoryTree()
  history.checkpoint()
  var tracker = trackHistory(history)

  async.series([
    history.commit.bind(history),
  ], function(){
    t.equal(tracker.accepted, 0, 'accepted correct number of times')
    t.equal(tracker.commit, 1, 'committed correct number of times')
    t.equal(tracker.rejected, 0, 'rejected correct number of times')
    t.equal(tracker.revert, 0, 'reverted correct number of times')
    t.end()
  })

})

test('partial resolve', function(t){
  t.plan(4)

  var history = new HistoryTree()
  history.checkpoint()
  history.checkpoint()
  var tracker = trackHistory(history)

  async.series([
    history.commit.bind(history),
  ], function(){
    t.equal(tracker.accepted, 0, 'accepted correct number of times')
    t.equal(tracker.commit, 1, 'committed correct number of times')
    t.equal(tracker.rejected, 0, 'rejected correct number of times')
    t.equal(tracker.revert, 0, 'reverted correct number of times')
    t.end()
  })

})

test('nested commit', function(t){
  t.plan(8)

  var parent = new HistoryTree()
  var child = parent.checkpoint()
  child.checkpoint()
  var parentTracker = trackHistory(parent)
  var childTracker = trackHistory(child)

  var firstToReport = null

  async.series([
    parent.commit.bind(parent),
  ], function(){
    t.equal(childTracker.accepted, 1, 'child - accepted correct number of times')
    t.equal(childTracker.commit, 1, 'child - committed correct number of times')
    t.equal(childTracker.rejected, 0, 'child - rejected correct number of times')
    t.equal(childTracker.revert, 0, 'child - reverted correct number of times')
    t.equal(parentTracker.accepted, 0, 'parent - accepted correct number of times')
    t.equal(parentTracker.commit, 1, 'parent - committed correct number of times')
    t.equal(parentTracker.rejected, 0, 'parent - rejected correct number of times')
    t.equal(parentTracker.revert, 0, 'parent - reverted correct number of times')
    t.end()
  })

})

test('child revert, parent commit', function(t){
  t.plan(8)

  var parent = new HistoryTree()
  var child = parent.checkpoint()
  child.checkpoint()
  var parentTracker = trackHistory(parent)
  var childTracker = trackHistory(child)

  async.series([
    child.revert.bind(child),
    parent.commit.bind(parent),
  ], function(){
    t.equal(childTracker.accepted, 1, 'child - accepted correct number of times')
    t.equal(childTracker.commit, 0, 'child - committed correct number of times')
    t.equal(childTracker.rejected, 0, 'child - rejected correct number of times')
    t.equal(childTracker.revert, 1, 'child - reverted correct number of times')
    t.equal(parentTracker.accepted, 0, 'parent - accepted correct number of times')
    t.equal(parentTracker.commit, 1, 'parent - committed correct number of times')
    t.equal(parentTracker.rejected, 0, 'parent - rejected correct number of times')
    t.equal(parentTracker.revert, 0, 'parent - reverted correct number of times')
    t.end()
  })

})

test('accept runs in correct order', function(t){
  t.plan(1)

  var parent = new HistoryTree()
  var childA = parent.checkpoint()
  var childA1 = childA.checkpoint()
  var childA2 = childA.checkpoint()
  var childB = parent.checkpoint()
  var childB1 = childB.checkpoint()
  var childB2 = childB.checkpoint()

  var events = []
  parent.on('accepted', function(){ events.push('P') })
  childA.on('accepted', function(){ events.push('A') })
  childA1.on('accepted', function(){ events.push('A1') })
  childA2.on('accepted', function(){ events.push('A2') })
  childB.on('accepted', function(){ events.push('B') })
  childB1.on('accepted', function(){ events.push('B1') })
  childB2.on('accepted', function(){ events.push('B2') })

  async.series([
    parent.accept.bind(parent),
  ], function(){
    t.equal(events.join(','), 'B2,B1,B,A2,A1,A,P', 'correct order of events'),
    t.end()
  })

})

function trackHistory(history){
  var tracker = {
    accepted:       0,
    commit:  0,
    rejected:       0,
    revert:  0,
  }
  history.on('accepted',       function(){ tracker.accepted++       })
  history.on('commit',  function(){ tracker.commit++  })
  history.on('rejected',       function(){ tracker.rejected++       })
  history.on('revert',  function(){ tracker.revert++  })
  return tracker
}