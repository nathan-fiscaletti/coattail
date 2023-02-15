# Subscription Process

## Subscribing
```mermaid
sequenceDiagram
    autonumber

    actor Publisher
    actor Subscriber

    Subscriber ->> Publisher: Subscribe to Action with Receiver
    Note over Publisher: Validate Request
    Note over Publisher: Issue Validation
    Publisher ->> Subscriber: Request Subscription Token using Validation & Authentication Token ID
    Note over Subscriber: Save Validation
    Note over Subscriber: Issue Subscription
    Subscriber ->> Publisher: Respond with Subscription Token and Subscription Token ID
    Note over Publisher: Save Subscription
    Publisher ->> Subscriber: Terminate Success with Subscription Token ID
```

## Unsubscribing

### From Subscriber

```mermaid
sequenceDiagram
    autonumber

    actor Publisher
    actor Subscriber

    Note over Subscriber: Validate Subscription
    Note over Subscriber: Delete Validation Token
    Note over Subscriber: Delete Subscription

    Subscriber ->> Publisher: Notify Unsubscribe

    Note over Publisher: Validate Subscription
    Note over Publisher: Validate Permissions
    Note over Publisher: Delete Subscription
```

### From Publisher
```mermaid
sequenceDiagram
    autonumber

    actor Publisher
    actor Subscriber

    Note over Publisher: Validate Subscription

    par
        Note over Publisher: Delete Subscription
    and
        Publisher ->> Subscriber: Notify Subscription Revocation
        Note over Subscriber: Validate Subscription
        Note over Subscriber: Validate Permissions
        Note over Subscriber: Delete VT
        Note over Subscriber: Delete Subscription
    end
```