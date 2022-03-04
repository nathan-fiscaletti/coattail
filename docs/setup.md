# Coattail Setup

## Installing Coattail

You will first need to install Coattail. Provided you already have [Node.js/npm](https://nodejs.org/en/download/) installed, installing Coattail is effortless.

Simply run the following command:
```sh
$ npm i -g coattail
```

## Creating a new Coattail Instance

> You will need an empty directory in which to store your Coattail Instances files.

```sh
$ mkdir my-coattail-instance
$ coattail new ./my-coattail-instance
```

Once you have created the Coattail Instance, you will need to run Database Migrations to set up the Coattail Instances database for first time use.

```sh
$ cd ./my-coattail-instance
$ coattail data migrate latest
```

You should now have the following file structure in your Coattail Instance directory.

```sh
.
├── actions            # <-- Actions that this instance can perform.
├── receivers          # <-- Receivers for incoming publications.
├── schemas            # <-- Schemas for action/receiver I/O validation.
├── config.yml         # <-- Instance configuration.
├── data.db            # <-- Local storage.
├── keys               # <-- Signing keys.
│   ├── auth-key.pem   # <-- Authentication private key.
│   ├── auth-key.pub   # <-- Authentication public key.
│   ├── vt-key.pem     # <-- Validation private key.
│   └── vt-key.pub     # <-- Validation public key.
└── service.log        # <-- Your service log file.
```

## Starting your Coattail Service

Your Coattail Instance will need to be running in order for other peers to subscribe to it. You should ideally run your Coattail Instance in headless mode to keep it running in the background.

```sh
$ cd my-coattail-instance
$ coattail service start --headless
```

You can check the status of your Coattial Service by running the following command:

```sh
$ coattail service status
```

Once your service is running, you can start using it.