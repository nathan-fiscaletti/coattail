const { queueAction } = require(`../lib/data/connection`);

queueAction("test", {name: "nathan", age: 26})
    .then(() => console.log('inserted'))
    .catch(error => console.log(error));