const async = require('async')
const EventEmitter = require('events').EventEmitter
const util = require('util')

module.exports = HistoryTree


util.inherits(HistoryTree, EventEmitter)

function HistoryTree() {
  this._children = []
}

// public

HistoryTree.prototype.commit = function(cb){
  var self = this
  var currentCheckpoint = self._children.pop()
  if (currentCheckpoint) {
    currentCheckpoint.commitAll(function(err){
      if (err) return cb(err)
      self.emit('commit', currentCheckpoint)
      self._checkIfResolved()
      cb()
    })
  } else {
    cb(new Error('Committed without a checkpoint.'))
  }
}

HistoryTree.prototype.revert = function(cb){
  var self = this
  var currentCheckpoint = self._children.pop()
  if (currentCheckpoint) {
    currentCheckpoint.revertAll(function(err){
      if (err) return cb(err)
      self.emit('revert', currentCheckpoint)
      self._checkIfResolved()
      cb()
    })
  } else {
    cb(new Error('Reverted without a checkpoint.'))
  }
}

HistoryTree.prototype.commitAll = function(cb){
  var self = this
  var self = this
  async.eachSeries(self._children, function(child, cb){
    self.commit(cb)
  }, cb)
}

HistoryTree.prototype.revertAll = function(cb){
  var self = this
  var self = this
  async.eachSeries(self._children, function(child, cb){
    self.revert(cb)
  }, cb)
}

HistoryTree.prototype.checkpoint = function(){
  var self = this
  var newChild = new HistoryTree()
  self._children.push(newChild)
  return newChild
}

// private

HistoryTree.prototype._checkIfResolved = function(){
  var self = this
  if (self._children.length === 0) {
    self.emit('resolved')
  }
}



