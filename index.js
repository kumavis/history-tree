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
  newChild.on('accepted', function(){ self.emit('commit', newChild) })
  newChild.on('rejected', function(){ self.emit('revert', newChild) })
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
    currentCheckpoint.accept(cb)
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
    currentCheckpoint.reject(cb)
  } else {
    cb(new Error('Reverted without a checkpoint.'))
  }
}

// commit all child checkpoints
HistoryTree.prototype.accept = function(cb){
  var self = this
  
  var commitChildren = function(cb){
    async.eachSeries(self._stack, function(child, cb){ self.commit(cb) }, cb)
  }

  async.series([
    commitChildren,
    self.emit.bind(self, 'accepted', undefined),
  ], cb)
}

// revert all child checkpoints
HistoryTree.prototype.reject = function(cb){
  var self = this
  
  var revertChildren = function(cb){
    async.eachSeries(self._stack, function(child, cb){ self.revert(cb) }, cb)
  }

  async.series([
    revertChildren,
    self.emit.bind(self, 'rejected', undefined),
  ], cb)
}
