# Using TLS

## Generating Certificate & Key

```sh
# Retrieve the issuer hash
# This will be used for the CA value in your certificate
$ coattail token issuer

# Generate the key
$ openssl genrsa -out server-key.pem 1024

# Generate a CSR for the certificate
# Make sure to use the issuer hash for the Common Name (CN)
$ openssl req -new -key server-key.pem -out server-csr.pem

# Generate the certificate
$ openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem

# Remove the CSR as we no longer need it.
$ rm server-csr.pem
```

## Configuring Instance

```yml
service:
  tls:
    use_tls: true
    key: '/absolute/path/to/server-key.pem'
    cert: '/absolute/path/to/server-cert.pem'
```
