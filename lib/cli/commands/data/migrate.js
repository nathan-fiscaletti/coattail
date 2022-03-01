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
        printHelp(cli);
        return;
    }

    const validActions = ['latest', 'rollback', 'up', 'down'];
    if (!validActions.includes(parameters.action)) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid action '${parameters.action}'.`);
        return;
    }

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

    const database = db();

    database.migrate[parameters.action](config.get().data.migrations).then(([batchNo, log]) => {
        if (parameters.action === 'latest') {
            if (log.length === 0) {
                console.log(chalk.hex('#6ce64e')('Already up to date.'));
                return;
            }
    
            console.log(chalk.hex('#6ce64e')(`Batch ${batchNo} run: ${log.length} migrations:${os.EOL}${log.join(os.EOL)}`));
        } else if (parameters.action === 'rollback') {
            if (log.length === 0) {
                console.log(chalk.hex('#6ce64e')('Already at the base migration.'));
                return;
            }
    
            console.log(chalk.hex('#6ce64e')(`Batch ${batchNo} rolled back: ${log.length} migrations`));
        } else if (parameters.action === 'up') {
            if (log.length === 0) {
                console.log(chalk.hex('#6ce64e')('Already up to date.'));
                return;
            }
    
            console.log(chalk.hex('#6ce64e')(`Batch ${batchNo} ran the following migrations:${os.EOL}${log.join(os.EOL)}`));
        } else if (parameters.action === 'down') {
            if (log.length === 0) {
                console.log(chalk.hex('#6ce64e')('Already at the base migration.'));
                return;
            }
    
            console.log(chalk.hex('#6ce64e')(`Batch ${batchNo} rolled back the following migrations:${os.EOL}${log.join(os.EOL)}`));
        }
    }).catch(error => {
        console.error(error);
    }).finally(() => database.destroy());
};