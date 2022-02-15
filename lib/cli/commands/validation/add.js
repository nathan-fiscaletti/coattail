const ValidationToken = require(`../../../validation-token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "token", alias: 't', defaultOption: true }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Add Signature Validation Token',
                content: 'Adds a new validation token to this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail validation add [options]`
                ]
            },
            {
                header: 'Options',
                optionList: [
                    {
                        name: 'help',
                        alias: 'h',
                        description: 'Shows this help message.',
                        type: Boolean
                    },
                    {
                        name: 'token',
                        alias: 't',
                        description: 'The validation token.'
                    }
                ]
            }
        ]);
        return;
    }

    if (options.token === undefined) {
        cli.missing('token');
        return;
    }

    let vt;
    try {
        vt = new ValidationToken({jwt: options.token});
        await vt.save();
        console.log('');
        console.log(`Validation token added with ID ${chalk.bold.underline(vt.id)}`);
        console.log(chalk.italic(`View more information by typing '${chalk.bold(`coattail validation show --id ${vt.id}`)}'`));
        console.log('');
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to add validation token`);
        console.error(err.stack)
    }
};