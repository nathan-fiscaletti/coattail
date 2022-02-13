module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Server',
            content: 'Manage your local coattail server.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail server <command> [options]`
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
                    summary: 'Starts the server.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};