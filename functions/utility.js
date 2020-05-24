const admin = require("firebase-admin");
const db = admin.database();
const corsConfig = require('cors')({
    origin: ['http://localhost:5000', 'https://permission-to-board.firebaseapp.com']
});

class Err {
    constructor(message = '') {
        this.message = message.toString();
    }

    toJSON() {
        return `{"message": "${this.message}"}`;
    }
}

function rand(max) {
    return Math.floor(max * Math.random());
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
            return reject(new Err('unauthorized'));
        }

        admin.auth().verifyIdToken(auth.split('Bearer ')[1])
            .then((user) => this.user = user)
            .then(resolve)
            .catch(() => reject(new Err('unauthorized')));
    });
}

function game() {
    let ref = db.ref(`/${this.request.query.key}/`);

    return new Promise((resolve, reject) => {
        ref.once('value', (dbGame) => {
            const game = this.request.game = dbGame.val();

            if (!game) {
                return reject(new Err(`game '${this.request.query.key}' not found`));
            }

            game.ref = ref;

            if (game.current) {
                game.current.color = game.current.player;
                game.current.player = game.players[game.current.color];
            }

            return resolve(game);            
        });
    });
}

function error(err) {
    console.log(err);
    this.statusCode = 400;
    this.end(JSON.stringify(err));
}

module.exports = { cors, auth, game, error, Err, rand };
