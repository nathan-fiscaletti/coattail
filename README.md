# Coattail

Coattail is a secure [peer-to-peer](https://en.wikipedia.org/wiki/Peer-to-peer) remote execution and queueless* [pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) service.

It's intention is to allow users to subscribe to the results of actions being performed on peered instances of Coattail and subsequently perform their own action based on the publication from the peer.

### General Use Case

```mermaid
sequenceDiagram
    participant PeerA
    participant Action
    participant PeerB
    participant Receiver

    Note over PeerA, Receiver: Subscribe to Action
    PeerB ->> PeerA: Subscribe to Action
    activate PeerA
    PeerA ->> PeerB: Respond with remote Subscription Token ID
    deactivate PeerA

    Note over PeerA, Receiver: Perform Action
    PeerA ->> Action: Perform Action
    activate Action
    note over Action: Logic
    Action ->> PeerA: Respond with Result
    deactivate Action
    activate PeerA
    PeerA ->> PeerB: Notify Subscriber with Result
    deactivate PeerA
    activate PeerB
    PeerB ->> Receiver: Publish Action Result
    deactivate PeerB
    activate Receiver
    note over Receiver: Logic
    Receiver -->> PeerB: Discard Result
    deactivate Receiver
```

**On PeerA**
```sh
# Create the action that will be used later.
$ coattail action create 'first-action'

# Start the server. Server must be running for other Coattail
# instances to add this instance as a Peer.
$ coattail server start --headless

# Issue a new token. Token will be copied to the clipboard.
$ coattail token issue
```

**On PeerB**
```sh
# Create the receiver that will be used for handling
# incoming publications.
$ coattail action create 'first-action-receiver'

# Start the server, allowing PeerA to communicate freely
# with this Coattail instance.
$ coattail server start --headless

# Add PeerA as a Peer. Will return a Peer ID.
$ coattail peer add <token>

# Subscribe to a remote action named 'first-action' and
# register the local action 'first-action-receiver' as a
# receiver for publications initiated by the remote action.
$ coattail action subscribe \
                  --peer <peer-id> \
                  --action 'first-action' \
                  --receiver 'first-action-receiver'
```

**On PeerA**
```sh
# Perform the action 'first-action' with the specified
# input data and publish the results of the action
# execution to it's subscribers.
$ coattail action perform \
                  --action 'first-action' \
                  --data '{"message":"Hello, world!"}' \
                  --publish-results

# Alternately, you can publish results directly to subscribers
# without executing the action. This will not execute the logic
# in the 'first-action', but will instead send the data directly
# to subscribers.
$ coattail action publish \
                  --action 'first-action' \
                  --data '{"message:"Hello, world!"}'

# At this point, PeerB should receive the action and trigger
# 'first-action-receiver'.
```

_* Coattail does not make use of a queue when publishing events to subscribers._