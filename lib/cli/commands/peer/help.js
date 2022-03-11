module.exports = async cli => {
    cli.printHelp([
        {
            header: 'Coattail -- Manage Peers',
            content: 'Manage peers registered on this Coattail instance.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail peer <command> [options]`
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
                    name: 'add',
                    summary: 'Registers a new peer to this Coattail instance.'
                },
                {
                    name: 'list',
                    summary: 'Lists all peers currently registered on this Coattail instance.'
                },
                {
                    name: 'remove',
                    summary: 'Remove a registered peer from this Coattail instance.'
                },
                {
                    name: 'show',
                    summary: 'Shows information for a particular peer registered on this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};