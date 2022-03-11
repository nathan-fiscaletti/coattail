module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Manage Subscribers',
            content: 'Manage subscribers to this Coattail instance.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail subscribers <command> [options]`
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
                    name: 'remove',
                    summary: 'Removes a subscription, notifying the peer that it will not longer receive notifications.'
                },
                {
                    name: 'list',
                    summary: 'Lists all active subscriptions from peers on this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};