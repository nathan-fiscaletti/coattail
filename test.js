const fs = require(`fs`);

console.log(fs.readdirSync(__dirname).filter(val => val.endsWith('.js')))