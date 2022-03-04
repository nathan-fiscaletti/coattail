## Coattail Instance File Structure

```
.
├── actions            <-- Actions that this instance can perform.
├── receivers          <-- Receivers for incoming publications.
├── schemas            <-- Schemas for action/receiver I/O validation.
├── config.yml         <-- Instance configuration.
├── data.db            <-- Local storage.
├── keys               <-- Signing keys.
│   ├── auth-key.pem   <-- Authentication private key.
│   ├── auth-key.pub   <-- Authentication public key.
│   ├── vt-key.pem     <-- Validation private key.
│   └── vt-key.pub     <-- Validation public key.
└── service.log        <-- Your service log file.
```