const package = require('../../../../package.json');
const fs = require(`fs`);
const chalk = require(`chalk`);
const findProcess = require('find-process');
const { spawn } = require(`child_process`);
const Service = require(`../../../service/service`);
const commandLineArgs = require('command-line-args');
const path = require(`path`);
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
        description: 'Run the service in the background.',
        type: Boolean
    },
    {
        name: 'instance',
        alias: 'i',
        description: 'The path to the local Coattail Instance.',
        typeLabel: '{underline path}'
    },
    {
        name: 'is-headless-instance',
        description: 'Internal parameter, do not use.',
        type: Boolean
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Start Service',
        content: 'Starts a Coattail service.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail service start [options]`
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

    try {
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`This command must be run from the root directory of a Coattail instance.`);
        return;
    }

    parameters.isHeadlessInstance = parameters['is-headless-instance'];

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    const procs = await findProcess('port', config.get().service.network.port);
    if (procs.length > 0) {
        const [ proc ] = procs;

        if (proc.cmd.includes('service start')) {
            cli.error(
                `A coattail service may already be running on port '${chalk.hex('#4e88e6')(config.service.network.port)}'.`, 
                `Use '${chalk.hex('#4e88e6')('coattail service status')}' for more information.`
            );
        } else {
            cli.error(
                `Another process is already using the desired port '${chalk.hex('#4e88e6')(config.service.network.port)}'.`,
                `Offending process: PID ${proc.pid}, CMD ${proc.cmd}`
            );
        }
        return;
    }

    if (parameters.headless) {
        const logFile = fs.openSync(config.get().service.log, 'a+');
        const spawned = spawn('node', [
            path.join(__dirname, '..', '..', '..', '..', 'bin', 'index.js'),
            'service', 'start',
            '--instance',
            config.get().paths.root,
            '--is-headless-instance'
        ], {
            stdio: [ 'ignore', logFile, logFile ],
            detached: true
        });

        // Wait 500ms for the process to potentially fail to start
        // and if it does, report the exit code.
        new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(resolve, 500);
            spawned.on('exit', code => {
                clearTimeout(timeoutHandle);
                reject(code)
            });
        }).then(() => {
            cli.success(
                chalk.hex('#6ce64e')('Service started'),
                `PID ${spawned.pid}, PORT ${config.get().service.network.port}`
            );
        }).catch(code => {
            if (code === 4) {
                cli.error(
                    `Failed to start service.`,
                    `Address ${config.get().service.network.address.bind} is not available.`
                );
            } else if (code === 5) {
                cli.error(
                    `Failed to start service.`,
                    `Port ${config.get().service.network.port} is in use.`
                );
            } else if (code === 6) {
                cli.error(
                    `Failed to start service.`,
                    `An unknown error occurred. See ${config.get().service.log} for more information.`
                );
            } else {
                cli.error(
                    `Failed to start service.`,
                    `Service process exited with exit code ${code}. See ${config.get().service.log} for more information.`
                );
            }
        }).finally(() => {
            spawned.unref()
        });
    } else {
        const service = new Service(parameters.isHeadlessInstance);
        service.logger.info(`===================== Service Starting =====================`);
        service.on('listening', function(port, address) {
            service.logger.info(`listening on ${address}:${port}`);
        });

        service.on('error', function(error) {
            service.logger.error(error);
            if (error && error.code) {
                if (error.code === "EADDRNOTAVAIL") {
                    process.exit(4);
                } else if (error.code === "EADDRINUSE") {
                    process.exit(5);
                }
            }

            process.exit(6);
        });

        service.listen();
    }
};