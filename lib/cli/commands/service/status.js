const chalk = require(`chalk`);
const findProcess = require('find-process');
const { table, getBorderCharacters  } = require(`table`);
const commandLineArgs = require('command-line-args');
const config = require(`../../../config`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file used by the service. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Service Status',
        content: 'Displays information about any running Coattail services.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail service status [options]`
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
    const processes = [];

    let procs = await findProcess('port', config.get().service.listen.port);
    for (const proc of procs) {
        proc.port = config.get().service.listen.port;
        processes.push(proc);
    }

    if (parameters.config === undefined) {
        procs = await findProcess('name', 'node');
        for (const proc of procs) {
            if (processes.filter(e => e.pid === proc.pid).length > 0) {
                continue;
            }

            if (proc.cmd.includes('service start')) {
                proc.port = config.get().service.listen.port;
                if (proc.cmd.includes('--config') || proc.cmd.includes('-c')) {
                    const res = /(--config|-c)\s(?<config>\d+)/.exec(proc.cmd);
                    if (res) {
                        config.load(res.config);
                        proc.port = config.get().service.listen.port;
                    }
                }
                processes.push(proc);
            }
        }
    }

    if (processes.length < 1) {
        console.error(`${chalk.hex('#e64e5e')('Error')}: No Coattail services found.`);
        return;
    }

    // Sort verified coattail processes first.
    processes.sort(first => first.cmd.includes('service start') ? -1 : 1);

    const data = [[
        chalk.hex('#4e88e6').bold('Type'),
        chalk.hex('#4e88e6').bold('PID'),
        chalk.hex('#4e88e6').bold('Port'),
        chalk.hex('#4e88e6').bold('Headless'),
        chalk.hex('#4e88e6').bold('Binary')
    ]];
    for (const proc of processes) {
        if (proc.cmd.includes('service start')) {
            const headless = proc.cmd.includes('--is-headless-instance true');
            data.push([
                chalk.hex('#6ce64e').bold('Coattail Service'),
                proc.pid,
                proc.port,
                headless ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No'),
                proc.bin
            ]);
        } else {
            data.push([
                chalk.hex('#e6d74e').italic('Other Process'),
                proc.pid,
                proc.port,
                '',
                proc.bin
            ]);
        }
    }

    const output = table(data, {
        border: getBorderCharacters('void'),
        columnDefault: {
            paddingLeft: 1,
            paddingRight: 1
        },
        drawHorizontalLine: () => false
    });

    console.log('');
    console.log(` ${chalk.bold.underline(`Potential Coattail Processes`)}`);
    console.log('');
    console.log(chalk.italic(` Use 'coattail service stop <PID>' to stop a ${chalk.hex('#4e88e6')('Headless Coattail Service')}.`));
    console.log('');
    console.log(output);
};