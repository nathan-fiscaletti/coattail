module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail',
            content: 'Coattail allows you to perform, manage whatever, i need to pdate this.'
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
                    name: 'service',
                    summary: 'Manage your local coattail service.'
                },
                {
                    name: 'peer',
                    summary: 'Manage registered peers on this Coattail instance.'
                },
                {
                    name: 'token',
                    summary: 'Manage tokens issued by your Coattail instance.'
                },
                {
                    name: 'action',
                    summary: 'Manage actions on either this Coattail instance or a peer.'
                },
                {
                    name: 'data',
                    summary: 'Manage the data for your Coattail instance.'
                },
                {
                    name: 'validation',
                    summary: 'Manage validation tokens.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};