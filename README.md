# Coattail

Coattail is a secure [peer-to-peer](https://en.wikipedia.org/wiki/Peer-to-peer) remote execution and queueless* [pub/sub](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) service.

It's intention is to allow users to subscribe to the results of actions being performed on peered instances of Coattail and subsequently perform their own action based on the publication from the peer.

### General Use Case Sequence Diagram
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

_* Coattail does not make use of a queue when publishing events to subscribers._