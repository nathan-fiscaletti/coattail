const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);

const commandLineArgs = require('command-line-args');
module.exports = (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean},
        { name: 'name', alias: 'n' }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Create Action',
                content: 'Creates a new action on this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail action create [options]`
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
                        name: 'name',
                        alias: 'n',
                        description: 'The name for the action.'
                    }
                ]
            }
        ]);
        return;
    }

    if (!options.name) {
        cli.missing('name');
        return;
    }

    const destination = path.join(__dirname, '..', '..', '..', '..', 'actions', `${options.name}.js`);

    if (fs.existsSync(destination)) {
        console.error('Error: An action with that name already exists.');
        return;
    }

    templates.create('action', destination);
    console.log(`Action ${options.name}.js created!`);
};