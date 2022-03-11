module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail',
            content: `Coattail is a secure peer-to-peer remote execution and queueless pub/sub service. It's intention is to allow users to subscribe to the results of actions being performed on peered instances of Coattail and subsequently perform their own action based on the publication from the peer.`
        },
        {
            header: 'Usage',
            content: [
                `$ coattail <command> [options]`
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
                    name: 'new',
                    summary: 'Creates a new Coattail instance.'
                },
                {
                    name: 'service',
                    summary: 'Manage the primary service for this Coattail instance.'
                },
                {
                    name: 'peer',
                    summary: 'Manage peers registered on this Coattail instance.'
                },
                {
                    name: 'token',
                    summary: 'Manage tokens issued by this Coattail instance.'
                },
                {
                    name: 'action',
                    summary: 'Manage actions on either this Coattail instance or a peer.'
                },
                {
                    name: 'data',
                    summary: 'Manage the data for this Coattail instance.'
                },
                {
                    name: 'validation',
                    summary: 'Manage validation tokens.'
                },
                {
                    name: 'subscribers',
                    summary: 'Manage subscribers to this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};