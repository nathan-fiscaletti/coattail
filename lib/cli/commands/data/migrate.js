const os = require(`os`);
const { db } = require(`../../../data/connection`);
const chalk = require(`chalk`);
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
        name: 'action',
        alias: 'a',
        description: `The action to perform. One of 'latest', 'rollback', 'up' or 'down'.`,
        defaultOption: true
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
        header: 'Coattail -- Database Migrations',
        content: 'Manages migrations for Coattail database.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail data migrate -a <action> [options]`,
            `$ coattail data migrate <action> [options]`,
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

    if(!cli.validateRequired(parameters, ['action'])) {
        return;
    }

    const validActions = ['latest', 'rollback', 'up', 'down'];
    if (!validActions.includes(parameters.action)) {
        cli.error(`Invalid action '${chalk.hex('#e6d74e')(parameters.action)}'.`, `Valid actions include: ${chalk.hex('#4e88e6')(validActions.join(', '))}`);
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    cli.waiting(`Running migrations...`);

    const database = db();

    database.migrate[parameters.action](config.get().data.migrations).then(([batchNo, log]) => {
        if (parameters.action === 'latest') {
            if (log.length === 0) {
                cli.success('Already up to date.');
                return;
            }
    
            cli.success(
                `Action '${chalk.hex('#4e88e6')(parameters.action)}' complete.`,
                chalk.hex('#6ce64e')(`Batch ${batchNo} run: ${log.length} migrations:${os.EOL}${log.join(os.EOL)}`)
            );
        } else if (parameters.action === 'rollback') {
            if (log.length === 0) {
                cli.success('Already at the base migration.');
                return;
            }
    
            cli.success(
                `Action '${chalk.hex('#4e88e6')(parameters.action)}' complete.`,
                chalk.hex('#6ce64e')(`Batch ${batchNo} rolled back: ${log.length} migrations`)
            );
        } else if (parameters.action === 'up') {
            if (log.length === 0) {
                cli.success('Already up to date.');
                return;
            }
    
            cli.success(
                `Action '${chalk.hex('#4e88e6')(parameters.action)}' complete.`,
                chalk.hex('#6ce64e')(`Batch ${batchNo} ran the following migrations:${os.EOL}${log.join(os.EOL)}`)
            );
        } else if (parameters.action === 'down') {
            if (log.length === 0) {
                cli.success('Already at the base migration.');
                return;
            }
    
            cli.success(
                `Action '${chalk.hex('#4e88e6')(parameters.action)}' complete.`,
                chalk.hex('#6ce64e')(`Batch ${batchNo} rolled back the following migrations:${os.EOL}${log.join(os.EOL)}`)
            );
        }
    }).catch(error => {
        cli.error('Failed to run migrations.', error.stack || error)
    }).finally(() => database.destroy());
};