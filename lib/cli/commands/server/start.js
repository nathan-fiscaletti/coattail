const fs = require(`fs`);
const chalk = require(`chalk`);
const findProcess = require('find-process');
const { spawn } = require(`child_process`);
const Server = require(`../../../server/server`);
const commandLineArgs = require('command-line-args');
const paths = require(`../../../paths`);
const process = require(`process`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'headless',
        alias: 'b',
        description: 'Run the server in the background.',
        type: Boolean
    },
    {
        name: 'port',
        alias: 'p',
        description: 'The port to run the server on. Defaults to the port defined in config.yml',
        type: Number
    },
    {
        name: 'address',
        alias: 'a',
        description: 'The address to run the server on. Defaults to the address defined in config.yml'
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Start Server',
        content: 'Starts a Coattail server.'
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
    if (parameters.port) {
        config.server.listen.port = parameters.port;
    }
    if (parameters.address) {
        config.server.listen.address = parameters.address;
    }

    const procs = await findProcess('port', config.server.listen.port);
    if (procs.length > 0) {
        const [ proc ] = procs;

        if (proc.cmd.includes('server start')) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: A coattail server may already be running on port '${chalk.hex('#4e88e6')(config.server.listen.port)}'.`);
            console.error(`       Use '${chalk.hex('#4e88e6')('coattail server status')}' for more information.`);
        } else {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Another process is already using the desired port '${chalk.hex('#4e88e6')(config.server.listen.port)}'.`);
            console.error(`       Offending process: PID ${proc.pid}, CMD ${proc.cmd}`);
        }
        return;
    }

    const server = new Server(config);

    server.on('listening', function(port, address) {
        server.logger.info(`listening on ${address}:${port}`);
    });

    server.on('error', function(error) {
        server.logger.error(error);
    });

    if (parameters.headless) {
        const extraParams = [];
        if (parameters.port) {
            extraParams.push('--port');
            extraParams.push(parameters.port);
        }
        if (parameters.address) {
            extraParams.push('--address');
            extraParams.push(parameters.address);
        }

        const logFile = fs.openSync(paths.DEFAULTS.SERVER_LOG, 'a+');
        const spawned = spawn('node', [
            paths.CMD_PATH,
            'server', 'start',
            ...extraParams,
            // This is not a real parameter, but it's used to determine if
            // the process was started in headless mode later on.
            '--is-headless-instance', 'true'
        ], {
            stdio: [ 'ignore', logFile, logFile ],
            detached: true
        });

        console.log(`${chalk.hex('#6ce64e')('Server started')}: PID ${spawned.pid}, PORT ${config.server.listen.port}`);
        spawned.unref();
    } else {
        const server = new Server(config);

        server.on('listening', function(port, address) {
            server.logger.info(`listening on ${address}:${port}`);
        });

        server.on('error', function(error) {
            server.logger.error(error);
        });

        server.listen();
    }
};