module.exports = (express, Config, SubscribeController) => ({
    start: () => {
        const app = express();
        app.use(express.json());

        // Register endpoints
        require(`../endpoints/subscribe`).register(app, SubscribeController);

        var server = app.listen(Config.port, function () {
            var host = server.address().address
            var port = server.address().port
            console.log("coattail api listening at http://%s:%s", host, port)
        });
    }
});