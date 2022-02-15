const Operation = require("../../operation");
const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.INITIAL,
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                authenticatedOnly: false,
                opCode,
                chain,
                data
            }
        );
    }

    //@on-host
    async handle(session) {
        const { auth: token } = this.data;

        try {
            new Peer({jwt: token}).token.tryAuthenticate(
                session.config,
                session.server.database,
                session.socket.remoteAddress
            );
            session.notifyAuthenticated();

            this.chain.op('auth.response', {
                authenticated: true,
                keepAliveInterval: session.config.server.keep_alive_interval,
                sessionId: session.id
            }).send(session);
        } catch (error) {
            console.log(error);
            session.logger.error(error);
            this.chain.op('auth.response', {
                authenticated: false, 
                keepAliveInterval: 0, 
                sessionId: ''
            }).send(session, () => {
                session.socket.end();
            });
        } finally {

        }
    }
};