const async = require('async')
const AsyncEventEmitter = require('async-eventemitter')
const util = require('util')

module.exports = HistoryTree


util.inherits(HistoryTree, AsyncEventEmitter)

function HistoryTree() {
  AsyncEventEmitter.call(this)
  this._stack = []
}

// public

// create a child checkpoint
HistoryTree.prototype.checkpoint = function(){
  var self = this
  var newChild = new HistoryTree()
  self._stack.push(newChild)
  // re-emit child's events
  newChild.on('commit', function(){ self.emit('childCommit', newChild) })
  newChild.on('revert', function(){ self.emit('childRevert', newChild) })
  return newChild
}

// get the top of the stack
HistoryTree.prototype.getCurrentCheckpoint = function(){
  var self = this
  var stack = self._stack
  return stack[stack.length-1]
}

// commit one child checkpoint
HistoryTree.prototype.commit = function(cb){
  var self = this
  var currentCheckpoint = self._stack.pop()
  if (currentCheckpoint) {
    // fully commit child checkpoint
    currentCheckpoint.commitAll(cb)
  } else {
    cb(new Error('Committed without a checkpoint.'))
  }
}

// revert one child checkpoint
HistoryTree.prototype.revert = function(cb){
  var self = this
  var currentCheckpoint = self._stack.pop()
  if (currentCheckpoint) {
    // fully revert child checkpoint
    currentCheckpoint.revertAll(cb)
  } else {
    cb(new Error('Reverted without a checkpoint.'))
  }
}

// commit all child checkpoints
HistoryTree.prototype.commitAll = function(cb){
  var self = this
  
  var commitAll = function(cb){
    async.eachSeries(self._stack, function(child, cb){ self.commit(cb) }, cb)
  }

  async.series([
    commitAll,
    self.emit.bind(self, 'commit', undefined),
  ], cb)
}

// revert all child checkpoints
HistoryTree.prototype.revertAll = function(cb){
  var self = this
  
  var revertAll = function(cb){
    async.eachSeries(self._stack, function(child, cb){ self.revert(cb) }, cb)
  }

  async.series([
    revertAll,
    self.emit.bind(self, 'revert', undefined),
  ], cb)
}
