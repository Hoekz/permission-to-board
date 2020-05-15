let functions = require('firebase-functions');
let admin = require("firebase-admin");
let serviceAccount = require("./secure/credentials.json");
// Initialize the app with a custom auth variable, limiting the server's access
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://permission-to-board.firebaseio.com"
});

let { cors, auth, game, error } = require('./utility');
let { createGame } = require('./create-game');
let { joinGame } = require('./join-game');
let { startGame } = require('./start-game');
let actions = require('./actions');

exports.createGame = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(createGame.bind({ request, response }))
    .catch(error.bind(response));
});

exports.joinGame = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(joinGame.bind({ request, response }))
    .catch(error.bind(response));
});

exports.startGame = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(startGame.bind({ request, response }))
    .catch(error.bind(response))
});

exports.takeCard = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(actions.mine.bind({ request, response }))
    .then(actions.take.bind({ request, response }))
    .catch(error.bind(response));
});

exports.drawCard = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(actions.mine.bind({ request, response }))
    .then(actions.draw.bind({ request, response }))
    .catch(error.bind(response));
});

exports.playPath = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(actions.mine.bind({ request, response }))
    .then(actions.play.bind({ request, response }))
    .catch(error.bind(response));
});

exports.skipTurn = functions.https.onRequest((request, response) => {
    Promise.resolve()
    .then(cors.bind({ request, response }))
    .then(auth.bind(request))
    .then(game.bind({ request }))
    .then(actions.mine.bind({ request, response }))
    .then(actions.skip.bind({ request, response }))
    .catch(error.bind(response));
});
