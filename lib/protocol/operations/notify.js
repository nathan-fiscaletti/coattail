const ActionManager = require(`../../action-manager`);
const Operation = require(`../operation`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.FIRE_AND_FORGET,
            // This operation direction might seem counter-intuitive, but the
            // server actually opens a connection to the client to send it.
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-host
    async handle(session) {
        const {subscription_token_id, data} = this.data;

        if(!session.token.claims().subscribedTo) {
            session.logger.error(`peer attempting to publish action to a receiver with an authentication token that is not a subscription token.`);
            return;
        }

        if(!session.token.claims().receiver) {
            session.loger.error(`peer attempting to publish action to receiver, but not receiver found in subscription token`);
            return;
        }

        const am = new ActionManager();
        am.load(session.token.claims().receiver).then(action => {
            action.performWithInputValidation(data).then(_ => {}).catch(err => {
                session.logger.error(`an error occured while processing a notification with the receiver ${receiver.action_name}.`);
                session.logger.error(err);
            });
        }).catch(err => {
            session.logger.error(`received notification with receiver ${receiver.action_name}, but no receiver found with that name.`);
            session.logger.error(err);
        });
    }
};