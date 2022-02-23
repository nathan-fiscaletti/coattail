const chalk = require(`chalk`);
const findProcess = require('find-process');
const { table, getBorderCharacters  } = require(`table`);
const commandLineArgs = require('command-line-args');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'port',
        alias: 'p',
        description: 'The port to retrieve server status for. When provided, will only display servers running on the specified port.',
        type: Number
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Server Status',
        content: 'Displays information about any running Coattail servers.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail server status [options]`
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

    const processes = [];

    let procs = await findProcess('port', config.server.listen.port);
    for (const proc of procs) {
        proc.port = config.server.listen.port;
        processes.push(proc);
    }

    if (parameters.port === undefined) {
        procs = await findProcess('name', 'node');
        for (const proc of procs) {
            if (processes.filter(e => e.pid === proc.pid).length > 0) {
                continue;
            }

            if (proc.cmd.includes('server start')) {
                proc.port = config.server.listen.port;
                if (proc.cmd.includes('--port')) {
                    const res = /(--port|-p)\s(?<port>\d+)/.exec(proc.cmd);
                    if (res) {
                        proc.port = res.groups.port;
                    }
                }
                processes.push(proc);
            }
        }
    }

    if (processes.length < 1) {
        console.error(`${chalk.hex('#e64e5e')('Error')}: No Coattail servers found.`);
        return;
    }

    // Sort verified coattail processes first.
    processes.sort(first => first.cmd.includes('server start') ? -1 : 1);

    const data = [[
        chalk.hex('#4e88e6').bold('Type'),
        chalk.hex('#4e88e6').bold('PID'),
        chalk.hex('#4e88e6').bold('Port'),
        chalk.hex('#4e88e6').bold('Headless'),
        chalk.hex('#4e88e6').bold('Binary')
    ]];
    for (const proc of processes) {
        if (proc.cmd.includes('server start')) {
            const headless = proc.cmd.includes('--is-headless-instance true');
            data.push([
                chalk.hex('#6ce64e').bold('Coattail Server'),
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
    console.log(chalk.italic(` Use 'coattail server stop <PID>' to stop a ${chalk.hex('#4e88e6')('Headless Coattail Server')}.`));
    console.log('');
    console.log(output);
};