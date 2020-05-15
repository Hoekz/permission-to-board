var admin = require("firebase-admin");
var db = admin.database();
var corsConfig = require('cors')({
    origin: ['http://localhost:5000', 'https://permission-to-board.firebaseapp.com']
});

function Err(msg) {
    this.message = msg;
}

Err.prototype.toJSON = function() {
    return `{message: ${this.message}}`;
}

function cors() {
    return new Promise((resolve, reject) => {
        corsConfig(this.request, this.response, (err) => {
            err ? reject(new Err('cors error')) : resolve(this)
        });
    });
}

function auth() {
    return new Promise((resolve, reject) => {
        var auth = this.headers.authorization;
        if (!auth || !auth.startsWith('Bearer')) {
            reject(new Err('unauthorized'));
        } else {
            admin.auth().verifyIdToken(auth.split('Bearer ')[1])
            .then((user) => this.user = user)
            .then(resolve)
            .catch(() => reject(new Err('unauthorized')));
        }
    });
}

function game() {
    let ref = db.ref(`/${this.request.query.key}/`);
    return new Promise((resolve, reject) => {
        ref.once('value', (game) => {
            var game = this.request.game = game.val();
            if (game) {
                game.ref = ref;
                game.current.color = game.current.player;
                game.current.player = game.players[game.current.color];
                return resolve(game);
            }

            reject(new Err(`game '${this.request.query.key}' not found`));
        });
    });
}

function error(err) {
    console.log(err);
    this.statusCode = 400;
    this.end(JSON.stringify(err));
}

module.exports = { cors, auth, game, error };
