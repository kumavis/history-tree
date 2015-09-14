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
  return newChild
}

// commit one child checkpoint
HistoryTree.prototype.commit = function(cb){
  var self = this
  var currentCheckpoint = self._stack.pop()
  if (currentCheckpoint) {
    async.series([
      // fully commit child checkpoint
      currentCheckpoint.commitAll.bind(currentCheckpoint),
      // async emit related events
      self._emitEventsFor.bind(self, 'commit', currentCheckpoint),
    ], cb)
  } else {
    cb(new Error('Committed without a checkpoint.'))
  }
}

// revert one child checkpoint
HistoryTree.prototype.revert = function(cb){
  var self = this
  var currentCheckpoint = self._stack.pop()
  if (currentCheckpoint) {
    async.series([
      // fully revert child checkpoint
      currentCheckpoint.revertAll.bind(currentCheckpoint),
      // async emit related events
      self._emitEventsFor.bind(self, 'revert', currentCheckpoint),
    ], cb)
  } else {
    cb(new Error('Reverted without a checkpoint.'))
  }
}

// commit all child checkpoints
HistoryTree.prototype.commitAll = function(cb){
  var self = this
  async.eachSeries(self._stack, function(child, cb){
    self.commit(cb)
  }, cb)
}

// revert all child checkpoints
HistoryTree.prototype.revertAll = function(cb){
  var self = this
  async.eachSeries(self._stack, function(child, cb){
    self.revert(cb)
  }, cb)
}

// private

// emit event on async ee, then check if resolved
HistoryTree.prototype._emitEventsFor = function(event, data, cb){
  var self = this
  async.series([
    self.emit.bind(self, event, data),
    self._checkIfResolved.bind(self),
  ], cb)
}

// check for remaining child checkpoints, if none emit 'resolve'
HistoryTree.prototype._checkIfResolved = function(cb){
  var self = this
  if (self._stack.length === 0) {
    self.emit('resolve', null, cb)
  } else {
    cb
  }
}

