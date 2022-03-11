module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Manage Tokens',
            content: 'Manage tokens issued by this Coattail instance.'
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
                },
                {
                    name: 'revoke',
                    summary: 'Revokes a token.'
                },
                {
                    name: 'list',
                    summary: 'Lists all tokens issued by this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};