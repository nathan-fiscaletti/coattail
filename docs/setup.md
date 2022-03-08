# Coattail Setup

## Installing Coattail

You will first need to install Coattail. Provided you already have [Node.js/npm](https://nodejs.org/en/download/) installed, installing Coattail is effortless.

Simply run the following command:
```sh
$ npm i -g coattail
```

## Creating a new Coattail Instance

> You will need an empty directory in which to store your Coattail Instances files.

![Create New Coattail Instance](./images/new-instance.png)

You should now have the following file structure in your Coattail Instance directory.

- 📂 __.__
   - 📂 __actions__ ─── Actions that this instance can perform.
   - 📂 __receivers__ ─── Receivers for incoming publications.
   - 📂 __keys__ ─── Signing keys.
     - 🔑 auth\-key.pem ─── Authentication private key.
     - 🔑 auth\-key.pub ─── Authentication public key.
     - 🔑 vt\-key.pem ─── Validation private key.
     - 🔑 vt\-key.pub ─── Validation public key.
   - 📄 config.yml ─── Instance configuration.
   - 🗃️ data.db ─── Local data storage.
   - 📄 service.log ─── Your service log file.
   - 📄 package.json ─── The package file for the Coattail instance.

## Running Database Migrations

Once you have created the Coattail Instance, you will need to run Database Migrations to set up the Coattail Instances database for first time use.

![Run Database Migrations](./images/migrate.png)

## Starting your Coattail Service

Your Coattail Instance will need to be running in order for other peers to subscribe to it. You should ideally run your Coattail Instance in headless mode to keep it running in the background.

![Start Coattail Service](./images/start-service.png)

You can check the status of your Coattial Service by running the following command:

![Coattail Service Status](./images/service-status.png)