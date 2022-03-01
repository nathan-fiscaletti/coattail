const fs = require(`fs`);
const chalk = require(`chalk`);
const findProcess = require('find-process');
const { spawn } = require(`child_process`);
const Service = require(`../../../service/service`);
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

    parameters.isHeadlessInstance = parameters['is-headless-instance'];

    try {
        config.load(parameters.instance);
    } catch (_) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Unable to location coattail instance in location '${parameters.instance || './'}'`);
        console.log('');
        return;
    }

    const procs = await findProcess('port', config.get().service.listen.port);
    if (procs.length > 0) {
        const [ proc ] = procs;

        if (proc.cmd.includes('service start')) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: A coattail service may already be running on port '${chalk.hex('#4e88e6')(config.service.listen.port)}'.`);
            console.error(`       Use '${chalk.hex('#4e88e6')('coattail service status')}' for more information.`);
        } else {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Another process is already using the desired port '${chalk.hex('#4e88e6')(config.service.listen.port)}'.`);
            console.error(`       Offending process: PID ${proc.pid}, CMD ${proc.cmd}`);
        }
        return;
    }

    if (parameters.headless) {
        const extraParams = [];
        if (parameters.instance) {
            extraParams.push('--instance');
            extraParams.push(parameters.instance);
        }

        const logFile = fs.openSync(config.get().service.log, 'a+');
        const spawned = spawn('node', [
            paths.CMD_PATH,
            'service', 'start',
            ...extraParams,
            '--is-headless-instance'
        ], {
            stdio: [ 'ignore', logFile, logFile ],
            detached: true
        });

        console.log(`${chalk.hex('#6ce64e')('Service started')}: PID ${spawned.pid}, PORT ${config.get().service.listen.port}`);
        spawned.unref();
    } else {
        const service = new Service(parameters.isHeadlessInstance);
        service.logger.info(`===================== Service Starting: Color ${!parameters.isHeadlessInstance} =====================`);
        service.on('listening', function(port, address) {
            service.logger.info(`listening on ${address}:${port}`);
        });

        service.on('error', function(error) {
            service.logger.error(error);
        });

        service.listen();
    }
};