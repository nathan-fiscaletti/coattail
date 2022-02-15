module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Validation Tokens',
            content: 'Manage validation tokens.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail validation <command> [options]`
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
                    summary: 'Issues a new validation token.'
                },
                {
                    name: 'add',
                    summary: 'Adds a new validation token to this Coattail instance.'
                },
                {
                    name: 'list',
                    summary: 'Lists all validation tokens loaded into this Coattail instance.'
                },
                {
                    name: 'show',
                    summary: 'Shows information for a particular validation token loaded into this Coattail instance.'
                },
                {
                    name: 'remove',
                    summary: 'Removes a validation token from this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};