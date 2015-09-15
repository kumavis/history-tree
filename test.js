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
    t.equal(tracker.commit, 0, 'committed correct number of times')
    t.equal(tracker.childCommit, 1, 'child committed correct number of times')
    t.equal(tracker.revert, 0, 'reverted correct number of times')
    t.equal(tracker.childRevert, 0, 'child reverted correct number of times')
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
    t.equal(tracker.commit, 0, 'committed correct number of times')
    t.equal(tracker.childCommit, 1, 'child committed correct number of times')
    t.equal(tracker.revert, 0, 'reverted correct number of times')
    t.equal(tracker.childRevert, 0, 'child reverted correct number of times')
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
    t.equal(childTracker.commit, 1, 'child - committed correct number of times')
    t.equal(childTracker.childCommit, 1, 'child - child committed correct number of times')
    t.equal(childTracker.revert, 0, 'child - reverted correct number of times')
    t.equal(childTracker.childRevert, 0, 'child - child reverted correct number of times')
    t.equal(parentTracker.commit, 0, 'parent - committed correct number of times')
    t.equal(parentTracker.childCommit, 1, 'parent - child committed correct number of times')
    t.equal(parentTracker.revert, 0, 'parent - reverted correct number of times')
    t.equal(parentTracker.childRevert, 0, 'parent - child reverted correct number of times')
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
    t.equal(childTracker.commit, 1, 'child - committed correct number of times')
    t.equal(childTracker.childCommit, 0, 'child - child committed correct number of times')
    t.equal(childTracker.revert, 0, 'child - reverted correct number of times')
    t.equal(childTracker.childRevert, 1, 'child - child reverted correct number of times')
    t.equal(parentTracker.commit, 0, 'parent - committed correct number of times')
    t.equal(parentTracker.childCommit, 1, 'parent - child committed correct number of times')
    t.equal(parentTracker.revert, 0, 'parent - reverted correct number of times')
    t.equal(parentTracker.childRevert, 0, 'parent - child reverted correct number of times')
    t.end()
  })

})

test('commitAll runs in correct order', function(t){
  t.plan(1)

  var parent = new HistoryTree()
  var childA = parent.checkpoint()
  var childA1 = childA.checkpoint()
  var childA2 = childA.checkpoint()
  var childB = parent.checkpoint()
  var childB1 = childB.checkpoint()
  var childB2 = childB.checkpoint()

  var events = []
  childA.on('commit', function(){ events.push('A') })
  childA1.on('commit', function(){ events.push('A1') })
  childA2.on('commit', function(){ events.push('A2') })
  childB.on('commit', function(){ events.push('B') })
  childB1.on('commit', function(){ events.push('B1') })
  childB2.on('commit', function(){ events.push('B2') })

  async.series([
    parent.commitAll.bind(parent),
  ], function(){
    t.equal(events.join(','), 'B2,B1,B,A2,A1,A', 'correct order of events'),
    t.end()
  })

})

function trackHistory(history){
  var tracker = {
    commit:       0,
    childCommit:  0,
    revert:       0,
    childRevert:  0,
    resolve:      0,
  }
  history.on('commit',       function(){ tracker.commit++       })
  history.on('childCommit',  function(){ tracker.childCommit++  })
  history.on('revert',       function(){ tracker.revert++       })
  history.on('childRevert',  function(){ tracker.childRevert++  })
  return tracker
}