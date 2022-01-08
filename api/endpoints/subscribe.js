module.exports = {
    register: (app, SubscribeController) => {
        app.post(`/subscribe`, SubscribeController.subscribe);
    }
};