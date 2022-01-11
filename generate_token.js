const { generateToken } = require(`./lib/authentication`);
const config = require(`./lib/config`).load();

console.log(generateToken(config));