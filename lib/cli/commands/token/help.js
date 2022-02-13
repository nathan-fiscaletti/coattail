module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Manage Tokens',
            content: 'Manage tokens issued by your Coattail instance.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail token <command> [options]`
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
                    name: 'issue',
                    summary: 'Issues a new token.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};