const { connect } = require(`../../data/connection`);
const { perform, queue } = require(`../../action-queue`);

module.exports = async (name) => {
    const connection = connect();
    try {
        console.log(`Performing action '${name}'...`);
        const action_yield = await perform(name, {}, connection);
        console.log(`Action Yielded:`, action_yield);
        console.log(`Queueing action yeild from action '${name}' for subscribers...`);
        await queue(name, action_yield, connection);
        connection.destroy();
        console.log(`Action '${name}' performed and queued for subscribers.`);
    } catch (err) {
        console.log(err);
    }
}