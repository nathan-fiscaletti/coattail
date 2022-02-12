const commandLineArgs = require('command-line-args');
const Server = require(`../../../server/server`);

module.exports = (cli) => {
    const options = commandLineArgs([
        { name: "help", alias: 'h', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
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
                optionList: [
                    {
                        name: 'help',
                        alias: 'h',
                        description: 'Shows this help message.',
                        type: Boolean
                    }
                ]
            }
        ]);
        return;
    }
    
    const config = require(`../../../server/config`).load();
    const server = new Server(config);

    server.on('listening', function(port, host) {
        server.logger.info(`listening on ${host}:${port}`);
    });

    server.on('error', function(error) {
        server.logger.error(error);
    });

    server.listen();
};