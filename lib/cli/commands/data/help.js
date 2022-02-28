module.exports = async (cli) => {
    cli.printHelp([
        {
            header: 'Coattail -- Data Management',
            content: 'Manage the data for your Coattail instance.'
        },
        {
            header: 'Usage',
            content: [
                `$ coattail data <command> [options]`
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
                    name: 'migrate',
                    summary: 'Manages migrations for Coattail database.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};