# Using TLS

## Generating Certificate & Key

```sh
$ openssl genrsa -out server-key.pem 1024
$ openssl req -new -key server-key.pem -out server-csr.pem
$ openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem
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
