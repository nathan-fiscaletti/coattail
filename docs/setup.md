# Coattail Setup

## Installing Coattail

You will first need to install Coattail. Provided you already have [Node.js/npm](https://nodejs.org/en/download/) installed, installing Coattail is effortless.

Simply run the following command:
```sh
$ npm i -g coattail
```

## Creating a new Coattail Instance

```sh
# Create a new directory
$ mkdir my-coattail-instance
# Run initial coattail setup
$ coattail new ./my-coattail-instance
# Run database migrations
$ cd ./my-coattail-instance
$ coattail data migrate latest
```

### Coattail Instance File Structure

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

## Starting your Coattail Service

```sh
$ cd my-coattail-instance
$ coattail service start --headless
```