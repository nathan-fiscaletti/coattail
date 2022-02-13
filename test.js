const path = require(`path`);

const ActionsManager = require(`./lib/action-manager`);

const am = new ActionsManager(path.join(__dirname, 'actions'));
am.load('example').then(action => {
    action.performWithValidation({'name': 'nathan'})
        .then(res => console.log(res))
        .catch(err => console.log(err));
}).catch(err => console.log(err));