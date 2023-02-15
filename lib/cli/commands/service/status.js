const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
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
        name: 'instance',
        alias: 'i',
        description: 'The path to the local Coattail Instance.',
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

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    const processes = [];

    let procs = await findProcess('port', config.get().service.network.port);
    for (const proc of procs) {
        proc.port = config.get().service.network.port;
        proc.instance = config.get().paths.root;
        processes.push(proc);
    }

    if (parameters.instance === undefined) {
        procs = await findProcess('name', 'node');
        for (const proc of procs) {
            if (processes.filter(e => e.pid === proc.pid).length > 0) {
                continue;
            }

            if (proc.cmd.includes('service start')) {
                proc.port = config.get().service.network.port;
                if (proc.cmd.includes('--instance') || proc.cmd.includes('-i')) {
                    const subProcParams = commandLineArgs(options, {
                        argv: proc.cmd.split(' ').slice(4),
                        stopAtFirstUnknown: true
                    });
                    if (subProcParams.instance) {
                        proc.instance = subProcParams.instance;
                        config.load(subProcParams.instance);
                        proc.port = config.get().service.network.port;
                        config.load(parameters.instance);
                    }
                }
                processes.push(proc);
            }
        }
    }

    if (processes.length < 1) {
        cli.error(`No Coattail services found.`);
        return;
    }

    // Sort verified coattail processes first.
    processes.sort(first => first.cmd.includes('service start') ? -1 : 1);

    const data = [[
        chalk.hex('#4e88e6').bold('Type'),
        chalk.hex('#4e88e6').bold('PID'),
        chalk.hex('#4e88e6').bold('Port'),
        chalk.hex('#4e88e6').bold('Instance'),
        chalk.hex('#4e88e6').bold('Headless'),
        chalk.hex('#4e88e6').bold('Binary')
    ]];
    for (const proc of processes) {
        if (proc.cmd.includes('service start')) {
            const headless = proc.cmd.includes('--is-headless-instance');
            data.push([
                chalk.hex('#6ce64e').bold('Coattail Service'),
                proc.pid,
                proc.port,
                proc.instance,
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

    const outputLines = output.split(/\r?\n/);
    cli.success(`Potential Coattail Processes`, [
        `Use '${chalk.hex('#4e88e6')(`coattail service stop <PID>`)}' to stop a service.`,
        '',
        ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
    ]);
};