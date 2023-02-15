<p align="center">
    <img src="./logo.png" />
</p>

# Coattail

Coattail is a secure [peer-to-peer](https://en.wikipedia.org/wiki/Peer-to-peer) remote execution and data publication service. It's intention is to provide a generic publication mechanism in which subscribers can utilize the publication data in anyway they see fit.

![Preview](./docs/images/preview.gif)

# Index

- [Features](#features)
- [Installing Coattail](#installing-coattail)
- [Getting started](#getting-started)
  - [Initializing a Coattail Instance](#initializing-a-coattail-instance)
  - [Managing your Coattail Service](#managing-your-coattail-service)
- [Configuring TLS for your Coattail Service](#configuring-tls-for-your-coattail-service)
  - [Generating Certificate & Key](#generating-certificate--key)
  - [Applying Certificate & Key](#applying-certificate--key)

# Features

|Feature|Documentation|
|---|---|
|Peer-to-peer architecture providing a decentralized base for communication.|[Coattail Architecture](./docs/architecture.md)|
|Easy to use data manipulation, publication and subscription.|[Subscriptions](./docs/architecture.md)|
|Modern command line interface for managing instances.|[CLI Usage](./docs/cli.md)|
|Secure permission driven remote execution on peered instances.|[Tokens](./docs/tokens.md)|
|Subscription based publication chaining.|[Publishing](./docs/publishing.md)|
|Support for secure signature based packet source verification.|[Validation Tokens](./docs/vts.md)|
|Support for TLS providing a secure tunnel with end-to-end encryption for data transport.|[TLS](#configuring-tls-for-your-coattail-service)|

# Installing Coattail

Coattail is primarily a command-line application. You can install Coattail via the [Node Package Manager](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). I would highly recommend you install NPM using [`nvm`](https://github.com/nvm-sh/nvm) instead of the official distribution. Provided you have NPM installed, you can run the following command to install Coattail.

```ps
$ npm i -g coattail
```

Once completed, the Coattail command will be available globally on your system. You can verify that the installation was successful by attempting to run the `coattail` command. You should see the following output. If you do not see the expected output, verify that your Node installations `bin` directory is added to your path. See [here](https://docs.npmjs.com/cli/v8/configuring-npm/folders#executables) for more information.

![Install Success](./docs/images/install-success-2.png)

# Getting started

This quick guide will walk you through creating your first Coattail instance and initializing it for first time use. It includes creating the Coattail instance, running it's database Migrations and starting it's core service.

## Initializing a Coattail Instance

> You will need an empty directory in which to store your Coattail Instances files.

```ps
$ mkdir "my-coattail-instance" ; cd "my-coattail-instance"
$ coattail new "./"
```

You should now have the following file structure in your Coattail Instance directory.

```yaml
my-coattail-instance/
├── actions            # Actions that can be performed with this instance.
│   └── <empty>
├── receivers          # Receivers for incoming publications.
│   └── <empty>
├── keys               # Cryptographic keys
│   ├── auth-key.pem   # Authentication private key.
│   ├── auth-key.pub   # Authentication public key.
│   ├── vt-key.pem     # Validation private key.
│   └── vt-key.pub     # Validation public key.
├── data.db            # Local data storage.
├── package.json       # The npm package file for the Coattail instance.
├── config.yml         # Instance configuration.
├── service.log        # Your service log file.
└── .ct.version        # Version file for Coattail CLI.
```

## Managing your Coattail service

There are several commands built into the Coattail CLI that can be used to manage the instance of Coattail running on your system. These can be used to start a service, stop a service or list running services on the system.

![Service Status](./docs/images/service-status-2.png)

### Starting a Service

Your Coattail Instance will need to be running in order to communicate with peering Coattail instances. You should ideally run your Coattail Instance in headless mode to keep it running in the background. To start your coattail instance, navigate to your Coattail instance and run the following command.

```ps
$ coattail service start --headless
```

### Viewing Service Status

You can check the status of your Coattail instance (along with any other Coattail instance running on the system) by navigating to any Coattail instance and running the following command.

```ps
$ coattail service status
```

### Stopping a Service

You can stop a Coattail instance by determining the PID for the service (this is listed in the output of the `status` command above) and passing it to the following command.

```ps
$ coattail service stop <pid>
```

# Configuring TLS for your Coattail Service

By default Coattail runs over plain TCP/IP. Coattial is most secure when running over TCP/IP with TLS. You can enable TLS in your instances `config.yml` file.
### Generating Certificate & Key

Before you can enable TLS, you will need to generate a Certificate and Key. It is important that when generating your certificate you provide the **Issuer Hash** from your Coattail instance for the "Common Name" (_CN_).

![Token Issuer](./docs/images/issuer-2.png)

> The token issuer is based on a Base-64 encoded SHA-256 hash of your public Validation Token. As such, replacing your Validation Token will change your issuer hash. This means that if you change your Validation Token you will also need to re-generate your Certificate & Key.

Once you've retrieved the issuer hash from your Coattail instance, you can generate the certificate and key using the following commands.

```ps
# Retrieve the issuer hash
# This will be used for the CN value in your certificate
$ coattail token issuer

# Generate the key
$ openssl genrsa -out "server-key.pem" 1024

# Generate a CSR for the certificate
# Make sure to use the issuer hash for the Common Name (CN)
$ openssl req -new -key "server-key.pem" -out "server-csr.pem"

# Generate the certificate
$ openssl x509 -req -in "server-csr.pem" -signkey "server-key.pem" -out "server-cert.pem"

# Remove the CSR as we no longer need it.
$ rm "server-csr.pem"
```

> I recommend you place this key and certificate in the `keys` directory of your Coattail instance alongside the other cryptographic keys used by the instance.

### Applying Certificate & Key

Once you have the keys, you will need to open your instances `config.yml` file and configure the `service.tls` section as written below. Be sure to use the absolute paths to your certificate and key files.

```yml
service:
  tls:
    enabled: true
    key: '/absolute/path/to/server-key.pem'
    cert: '/absolute/path/to/server-cert.pem'
```

Once it has been configured, make sure that you restart your Coattail Instances service if it is already running. See [Managing your Coattail service](#managing-your-coattail-service) for more information on starting/stopping your Coattail service.

> Any tokens issued before you modify the service section of your configuration will cease to function with your Coattail instance. It's recommended that you configure your instance before issuing any tokens.
