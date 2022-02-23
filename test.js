const { groups: { port } } = /--port\s(?<port>\d+)/.exec('coattail server start --asdf idk --port asdf --idk');
console.log(port);