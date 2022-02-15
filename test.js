const ipRangeCheck  = require(`ip-range-check`);

const range = '0.0.0.0/0';
const ip = '255.255.255.255';

console.log(ipRangeCheck(ip, range));