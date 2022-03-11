module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Service',
            content: 'Manage the primary service for this Coattail instance.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail service <command> [options]`
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
                    name: 'start',
                    summary: 'Starts a Coattail service.'
                },
                {
                    name: 'status',
                    summary: 'Displays information about any running Coattail services.'
                },
                {
                    name: 'stop',
                    summary: 'Stops a running Coattail service.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};