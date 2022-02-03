const { connect } = require(`../../data/connection`);
const { perform } = require(`../../action-queue`);

module.exports = async (name) => {
    const connection = connect();
    try {
        await perform(name, {}, connection, () => {
            connection.destroy();
        });
    } catch (err) {
        console.log(err);
    }
}