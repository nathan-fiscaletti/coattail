const subscriptions = require(`../controllers/subscriptions`);

module.exports = {
    register: (app) => {
        app.post(`/subscribe`, subscriptions.subscribe);
    }
};