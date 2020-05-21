const functions = require('firebase-functions');
const admin = require("firebase-admin");
const serviceAccount = require("./secure/credentials.json");
// Initialize the app with a custom auth variable, limiting the server's access
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://permission-to-board.firebaseio.com"
});

const { cors, auth, game, error } = require('./utility');
const { createGame } = require('./create-game');
const { joinGame } = require('./join-game');
const { startGame } = require('./start-game');
const actions = require('./actions');

const requireAuth = (...methods) => functions.https.onRequest((request, response) =>
    methods.reduce(
        (promise, method) => promise.then(method.bind({ request, response })
    ), Promise.resolve()
        .then(cors.bind({ request, response }))
        .then(auth.bind(request))
    ).catch(error.bind(response))
);

const withGame = (...methods) => requireAuth(game, ...methods);

const onMyTurn = (...methods) => withGame(actions.mine, ...methods);

exports.createGame = requireAuth(createGame);
exports.joinGame = withGame(joinGame);
exports.startGame = withGame(startGame);
exports.takeCard = onMyTurn(actions.take);
exports.drawCard = onMyTurn(actions.draw);
exports.playPath = onMyTurn(actions.play);
exports.skipTurn = onMyTurn(actions.skip);