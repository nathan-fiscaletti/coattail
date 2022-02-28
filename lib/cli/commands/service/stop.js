const chalk = require(`chalk`);
const kill = require(`tree-kill`);
const findProcess = require('find-process');
const commandLineArgs = require('command-line-args');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'pid',
        alias: 'p',
        description: 'The PID of the service to stop.',
        type: Number,
        defaultOption: true
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Stop Service',
        content: 'Stops a running Coattail service.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail service stop [options]`
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

    if(!cli.validateRequired(parameters, ['pid'])) {
        printHelp(cli);
        return;
    }

    const processes = [];

    const procs = await findProcess('name', 'node');
    for (const proc of procs) {
        if (proc.cmd.includes('service start')) {
            processes.push(proc);
        }
    }

    if(processes.filter(p => p.pid === parameters.pid).length < 1) {
        console.error(`${chalk.hex('#e64e5e')('Error')}: No Coattail services found for the specified PID.`);
        return;
    }

    kill(parameters.pid, (error) => {
        if (error) {
            console.error(`${chalk.hex('#e64e5e')('Error')}: Failed to kill Coattail service with PID '${parameters.pid}'.`);
            console.error(`       ${error.message}`);
        } else {
            console.log(`${chalk.hex('#6ce64e')('Success')}: Stopped Coattail service running at PID ${parameters.pid}.`);
        }
    })
};