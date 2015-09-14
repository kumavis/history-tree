# history-tree

Tree for tracking reverts and commits on checkpoints.
Checkpoints can nest arbitrarily deep.

## api

### methods

##### new HistoryTree() -> history tree

Constructor. Creates a history tree.

##### historyTree.checkpoint() -> history sub-tree

Synchronous.
Creates a new history sub-tree and adds it to the checkpoint stack.

##### historyTree.commit(cb)

Asynchronous.
Removes the top sub-tree from the checkpoint stack,
calls commitAll on the sub-tree,
then emits `commit` on this tree.
If it was the last checkpoint on the stack, this tree emits `resolve`.
Calls the callback with an Error if the stack is empty.

##### historyTree.revert(cb)

Asynchronous.
Removes the top sub-tree from the checkpoint stack,
calls `revertAll` on the sub-tree,
then emits `revert` on this tree.
If it was the last checkpoint on the stack, this tree emits `resolve`.
Calls the callback with an Error if the stack is empty.

##### historyTree.commitAll(cb)

Asynchronous.
Calls `commit` on this tree for all checkpoints on the stack, in series.
Does NOT call the callback with an Error if the stack is empty.

##### historyTree.revertAll(cb)

Asynchronous.
Calls `revert` on this tree for all checkpoints on the stack, in series.
Does NOT call the callback with an Error if the stack is empty.

### events

HistoryTree is an [AsynchronousEventEmitter](https://github.com/ahultgren/async-eventemitter).
This means that HistoryTree's async api calls won't complete until all event listeners call their callback, unless the listener is synchronous.
See the AsynchronousEventEmitter api for usage.

##### 'commit' -> function(subTree, [next])

Called AFTER a commit on the HistoryTree.
Called everytime a commit is called on this tree.

##### 'revert' -> function(subTree, [next])

Called AFTER a revert on the HistoryTree.
Called everytime a revert is called on this tree.

##### 'resolve' -> function([next])

Called AFTER the checkpoint stack is emptied.
Called everytime the stack is emptied on this tree.