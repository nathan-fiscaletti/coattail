const fs = require(`fs`);
const chalk = require(`chalk`);
const findProcess = require('find-process');
const { spawn } = require(`child_process`);
const Server = require(`../../../server/server`);
const commandLineArgs = require('command-line-args');
const paths = require(`../../../paths`);
const process = require(`process`);
const config = require(`../../../config`);

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
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use for the server. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
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

    config.load(parameters.config);

    const procs = await findProcess('port', config.get().server.listen.port);
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

    const server = new Server();

    server.on('listening', function(port, address) {
        server.logger.info(`listening on ${address}:${port}`);
    });

    server.on('error', function(error) {
        server.logger.error(error);
    });

    if (parameters.headless) {
        const extraParams = [];
        if (parameters.config) {
            extraParams.push('--config');
            extraParams.push(parameters.config);
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

        console.log(`${chalk.hex('#6ce64e')('Server started')}: PID ${spawned.pid}, PORT ${config.get().server.listen.port}`);
        spawned.unref();
    } else {
        const server = new Server();

        server.on('listening', function(port, address) {
            server.logger.info(`listening on ${address}:${port}`);
        });

        server.on('error', function(error) {
            server.logger.error(error);
        });

        server.listen();
    }
};