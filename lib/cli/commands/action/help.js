module.exports = async cli => {
    cli.printHelp([
        {
            header: 'Coattail -- Manage Actions',
            content: 'Manage actions on either this Coattail instance or a peer.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail action <command> [options]`
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
                }
            ]
        },
        {
            header: 'Commands',
            content: [
                {
                    name: 'create',
                    summary: 'Creates a new action on this instance.'
                },
                {
                    name: 'list',
                    summary: 'Lists actions on an instance.'
                },
                {
                    name: 'perform',
                    summary: 'Performs an action on an instance.'
                },
                {
                    name: 'publish',
                    summary: 'Publishes data to the subscribers of an action.'
                },
                {
                    name: 'subscribe',
                    summary: 'Subscribes to an action on an instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};