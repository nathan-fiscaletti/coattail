const environment = require(`../../environment`);
const config = require(`../../config`);
const connection = require(`../../core/data/connection`);

module.exports = {
    description: 'Basic actions pertaining to database management.',
    actions: { 
        "migrate": {
            description: 'Manages migrations',
            flags: {
                "latest": "Run all migrations that have not yet been run.",
                "rollback": "Rollback the last batch of migrations performed."
            }
        },
    },

    migrate: async (flags) => {
        const conf = config.load();
        const conn = connection.connect(conf);

        if (flags.includes('latest')) {
            console.log(`Using environment: ${environment.getEnvironmentName()}`)
            const [batchNo, log] = await conn.migrate.latest({
                directory: './lib/core/data/migrations'
            });
            if (log.length === 0) {
                console.log('Already up to date');
            }
            console.log(`Batch ${batchNo} run: ${log.length} migrations`);
            console.log(log.join('\n'));
            process.exit();
        }

        if (flags.includes('rollback')) {
            console.log(`Using environment: ${environment.getEnvironmentName()}`)
            const [batchNo, log] = await conn.migrate.rollback({
                directory: './lib/core/data/migrations'
            });
            if (log.length === 0) {
                console.log('Already at the base migration');
            }
            console.log(`Batch ${batchNo} rolled back: ${log.length} migrations`);
            console.log(log.join('\n'));
            process.exit();
        }
    }
}

