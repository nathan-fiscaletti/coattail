const VALID_ENVS = [ 'development', 'production', 'staging' ];

function getEnvironmentName(env = 'development') {
    if (process.env.NODE_ENV) {
        if (!VALID_ENVS.includes(process.env.NODE_ENV)) {
            throw new Error(`Invalid value ${process.env.NODE_ENV} for NODE_ENV envirionment variable. Must be one of [ ${VALID_ENVS.join(', ')} ].`);
        }
        env = process.env.NODE_ENV;
    }

    return env;
}

module.exports = {
    getEnvironmentName
};