const crypto = require(`crypto`);
const fs = require(`fs`);

console.log(
    crypto.createHash('sha256').update(fs.readFileSync('/home/nathan/coattail-demo/ct1/keys/auth-key.pem').toString()).digest('hex').toString()
);