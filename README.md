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
calls `accept` on the sub-tree,
then emits `commit` on this tree.
Calls the callback with an Error if the stack is empty.

##### historyTree.revert(cb)

Asynchronous.
Removes the top sub-tree from the checkpoint stack,
calls `reject` on the sub-tree,
then emits `revert` on this tree.
Calls the callback with an Error if the stack is empty.

##### historyTree.accept(cb)

Asynchronous.
Calls `commit` on this tree for all checkpoints on the stack, in series.
Does NOT call the callback with an Error if the stack is empty.
Emits event `accepted` on this tree.

##### historyTree.reject(cb)

Asynchronous.
Calls `revert` on this tree for all checkpoints on the stack, in series.
Does NOT call the callback with an Error if the stack is empty.
Emits event `rejected` on this tree.

### events

HistoryTree is an [AsynchronousEventEmitter](https://github.com/ahultgren/async-eventemitter).
This means that HistoryTree's async api calls won't complete until all event listeners call their callback, unless the listener is synchronous.
See the AsynchronousEventEmitter api for usage.

##### 'accepted' -> function(subTree, [next])

Called AFTER the `accept(cb)` on this HistoryTree node.

##### 'rejected' -> function(subTree, [next])

Called AFTER the `reject(cb)` on this HistoryTree node.

##### 'commit' -> function(subTree, [next])

Called AFTER every `commit(cb)` on this HistoryTree node.

##### 'revert' -> function(subTree, [next])

Called AFTER every `revert(cb)` on this HistoryTree node.


