const commandLineArgs = require('command-line-args');
const Server = require(`../../../server/server`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Start Server',
        content: 'Starts the server.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail server start [options]`
        ]
    },
    {
        header: 'Options',
        optionList: options
    }
]);

module.exports = async cli => {
    const parameters = commandLineArgs(options, {
        argv: cli.argv,
        stopAtFirstUnknown: true
    });

    if (parameters.help) {
        printHelp(cli);
        return;
    }
    
    const config = require(`../../../config`).load();
    const server = new Server(config);

    server.on('listening', function(port, host) {
        server.logger.info(`listening on ${host}:${port}`);
    });

    server.on('error', function(error) {
        server.logger.error(error);
    });

    server.listen();
};