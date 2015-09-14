const test = require('tape')
const async = require('async')
const HistoryTree = require('./index.js')


test('flat commit', function(t){
  t.plan(3)

  var history = new HistoryTree()
  history.checkpoint()
  var tracker = trackHistory(history)

  async.series([
    history.commit.bind(history),
  ], function(){
    t.equal(tracker.didCommit, 1, 'committed correct number of times')
    t.equal(tracker.didRevert, 0, 'reverted correct number of times')
    t.equal(tracker.didResolve, 1, 'resolved correct number of times')
    t.end()
  })

})

test('nested commit', function(t){
  t.plan(7)

  var parent = new HistoryTree()
  var child = parent.checkpoint()
  child.checkpoint()
  parentTracker = trackHistory(parent)
  childTracker = trackHistory(child)

  var firstToReport = null

  parent.on('resolve', function(){ if (!firstToReport) firstToReport = parent })
  child.on('resolve',  function(){ if (!firstToReport) firstToReport = child })

  async.series([
    parent.commit.bind(parent),
  ], function(){
    t.ok(firstToReport === child, 'child reported as resolved first')
    t.equal(childTracker.didCommit, 1, 'committed correct number of times')
    t.equal(childTracker.didRevert, 0, 'reverted correct number of times')
    t.equal(childTracker.didResolve, 1, 'resolved correct number of times')
    t.equal(parentTracker.didCommit, 1, 'committed correct number of times')
    t.equal(parentTracker.didRevert, 0, 'reverted correct number of times')
    t.equal(parentTracker.didResolve, 1, 'resolved correct number of times')
    t.end()
  })

})

test('child revert, parent commit', function(t){
  t.plan(6)

  var parent = new HistoryTree()
  var child = parent.checkpoint()
  child.checkpoint()
  parentTracker = trackHistory(parent)
  childTracker = trackHistory(child)

  async.series([
    child.revert.bind(child),
    parent.commit.bind(parent),
  ], function(){
    t.equal(childTracker.didCommit, 0, 'committed correct number of times')
    t.equal(childTracker.didRevert, 1, 'reverted correct number of times')
    t.equal(childTracker.didResolve, 1, 'resolved correct number of times')
    t.equal(parentTracker.didCommit, 1, 'committed correct number of times')
    t.equal(parentTracker.didRevert, 0, 'reverted correct number of times')
    t.equal(parentTracker.didResolve, 1, 'resolved correct number of times')
    t.end()
  })

})

test('commits wait for callbacks', function(t){
  t.plan(1)

  var history = new HistoryTree()
  history.checkpoint()

  var events = []
  // commit late
  history.on('commit', function(event, cb){
    setImmediate(function(){
      events.push('commit')
      cb()
    })
  })
  // resolve immediately
  history.on('resolve', function(){
    events.push('resolve')
  })

  async.series([
    history.commit.bind(history),
  ], function(){
    t.equal(events.join(','), 'commit,resolve', 'correct order of events'),
    t.end()
  })

})

function trackHistory(history){
  var tracker = {
    didCommit: 0,
    didRevert: 0,
    didResolve: 0,
  }
  history.on('commit', function(){ tracker.didCommit++ })
  history.on('revert', function(){ tracker.didRevert++ })
  history.on('resolve', function(){ tracker.didResolve++ })
  return tracker
}