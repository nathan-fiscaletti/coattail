# Coattail: Authentication

## Configuration

### Token Ownership

Tokens issued by a Coattail instance correspond directly to the `address` and `port` configured in the `config.yml` file. This means, if you change those values or use a different configuration file, tokens issued with the old values will no longer be considered valid (or even work for Bearers who are using them).

If you wish to manage tokens for a particular Coattail instance that is running, be sure to pass `--config <your_config>` to the respective token management commands.

### Token Signatures

In your `config.yml` file there is a section labeled `authentication`. In this section you should define a key-pair that will be used for signing/verifying authentication tokens.

```yml
authentication:
  private_key:
    type: "string"
    value: "my-secret-password"
  public_key:
    type: "string"
    value: "my-secret-password"
```

**`type`**

* Can be one of "string" or "file".

**`value`**
* When `type` is set to "string", `value` should be the string value of your private key.
* When `type` is set to "file", `value` should be the path to the corresponding key file, relative to the root installation directory of your Coattail instance.

> Warning: Using "string" type keys is **not** recommended for production instances of Coattail.

## Token Issuance

### Definitions

* "**Issuing Coattail Instance**": The Coattail instance that is generating a Token to be used by other Coattail instances to connect to it.
* "**Bearing Coattail Instance**": The Coattail instance that uses the issued Token to connect to the Issuing Coattail Instance.

### Basic Token Issuance

To issue a generic token you can run the following command on the _Issuing Coattail Instance_.
```sh
$ coattail token issue
```

This will issue a signed token that can be used by a _Bearing Coattail Instance_ to connect to the _Issuing Coattail Instance_. The permissions embeded in the token will allow the _Bearing Coattail Instance_ to subscribe to any action on the _Issuing Coattail Instance_, but it will not be able to remotely perform or publish actions on its behalf.

After executing the command, by default, the issued token will be stored locally in your database and the raw JWT will be copied to your clipboard. If you wish to print the token instead of copying it to the clipboard, you can use `--print-raw-token`.

> Combining the `--quiet` option with the `--print-raw-token` option allows you to get the issue command to spit out **only** the raw token. This is useful when scripting with Coattail.

### Token Bearers

You can specify _Bearing Coattail Instances_ who are authorized to use a particular token by passing a JSON serialized array to the `--bearers` parameter. When doing this, the issued token will **only** be valid if used from a _Bearing Coattail Instance_ with an IPv4 address within one of the IPv4 subnet specified in the bearers, or from a _Bearing Coattail Instance_ who has the Validation Token specified by one of the Validation Token ID's set in the Bearers array.

Each Bearer can be either a [Validation Token ID](#validation-tokens) or an IPv4 subnet.
* Bearers containing a _Validation Token ID_ should be prefixed with `vt://`. 
* Bearers containing an _IPv4 Subnet_ should be prefixed with `ipv4://` and the subnet mask should be formatted with [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) notation.

**Example**
```sh
$ coattail token issue --bearers '[
    "vt://159193bc-cbf2-47a2-8cae-97d562de40e1",
    "ipv4://192.168.0.0/24"
]'
```

### Token Permissions

When issuing a token, you can specify which actions the _Bearing Coattail Instance_ can perform, publish or subscribe to on the issuing Coattail instance.

> See: [Managing Actions](./actions.md) for more information on the distinction between "publishing" an action and "performing" an action.

* "**Subscribable**": A JSON encoded array containing action names corresponding to actions on the _Issuing Coattail Instance_ who's output can be subscribed to by the _Bearing Coattail Instance_.
* "**Publishable**": A JSON encoded array containing action names corresponding to actions on the _Issuing Coattail Instance_ who's subscribers can be remotely notified by the _Bearing Coattail Instance_ with plain data.
* "**Performable**": A JSON encoded array containing action names corresponding to actions on the _Issuing Coattail Instance_ that can be remotely performed by the _Bearing Coattail Instance_.

By default, tokens are issued by the _Issuing Coattail Instance_ with **all** actions being subscribable and **no** actions being remotely performable or publishable.

> If you provide a `*` value as an array element to any of these options, it will indicate to the _Issuing Coattail Instance_ that this token can be used to perform, publish or subscribe to (respectively) any action.

**Example**
```sh
$ coattail token issue --performable '["action1","action2"]' \
                       --publishable '["action1","action2","action3"]' \
                       --subscribable '["*"]'
```

### Token Lifetime

When issuing a token, you can specify the time period during which the token will be valid. This is done using the `--not-before` and `--expires-in` options.

By default, tokens issued by the _Issuing Coattail Instance_ can be used immediately and never expire.

> Note: All timestamps use [vercel/ms](https://github.com/vercel/ms) format.

* **`--not-before`**: Indicates the time at which this token becomes usable.
* **`--expires-in`**: Indicates the time at which this token expires.

**Example**
```sh
# Issue a token that can start being used one week from now
# and expires two weeks from now.
$ coattail token issue --not-before 1w \
                       --expires-in 2w
```

## Token Revocation

You can revoke an issued token so that _Bearing Coattail Instances_ who have been issued that token can no longer use it to authenticate with the _Issuing Coattail Instance_.

When the token is initially issued by the _Bearing Coattail Instance_, you will be given an ID corresponding to the token. To revoke that token, simply pass that ID to the `revoke` command.

**Example**
```sh
$ coattail token revoke 73708702-6f0e-47c3-a76a-6e3db433c564
```

Running this command will prompt you for a confirmation. If you wish to bypass the confirmation prompt, you can run the command with the `--force` option.

## Validation Tokens

Validation Tokens are a special type of Token that can be used to verify that a particular _Bearing Coattail Instance_ is authorized to use the token it's bearing.

They are generated by the _Bearing Coattail Instance_ and used as a Bearer when when issuing general purpose tokens on an _Issuing Coattail Instance_.

1. Generate a validation token on the _Bearing Coattail Instance_.
   > The `validation issue` command supports the same `--not-before`, `--expires-in`, `--print-raw-token` and `--quiet` options as the `token issue` command.

   ```sh
   $ coattail validation issue
   ```

   This will issue an unsigned validation token containing the _Bearing Coattail Instance's_ public signing key. This token will never expire and can be used immediately.

2. Distribute the token to any _Issuing Coattail Instance_ who wishes to be able to validate authentication requests made from your _Bearing Coattail Instance_.

3. On the _Issuing Coattail Instance_, load the validation token into the database.

   ```sh
   $ coattail validation add <validation-token>
   ```

   This will make the validation token available for general token issuange.

   > Note the Token ID returned for the Validation Token.

4. On the _Issuing Coattail Instance_ generate a new token using the Validation Token as a Bearer. You can do this by prefixing the validation token ID with `vt://` when providing it to the array of bearers. See [Token Bearers](#token-bearers) for more information.

   ```sh
   $ coattail token issue --bearers '[
       "vt://<vallidation-token-id>"
   ]'
   ```

The token that has been generated will now ONLY be authorized when used from the _Bearing Coattail Instance_ on which the Validation Token was generated. This is determined by a signature on the authentication payload signed by the _Bearing Coattail Instance_ using it's private key. That signature is then verified using the public key stored in the Validation Token that was loaded into the _Issuing Coattail Instances_ database.

You can further manage validation tokens on an _Issuing Coattail Instance_ using the `list`, `show` and `remove` sub-commands under the `validation` command.

See `coattail validation --help` for more information.