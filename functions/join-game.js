const { Err } = require('./utility');

const colors = ['red', 'yellow', 'green', 'blue', 'black'];

function createPlayer(user) {
    return {
        uid: user.uid,
        name: user.name,
        hand: {
            red: 0,
            orange: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            violet: 0,
            black: 0,
            white: 0,
            locomotive: 0
        },
        trains: 45
    };
}

function joinGame() {
    let game = this.request.game;
    let color = this.request.query.color;
    let user = this.request.user;

    if (game.started) {
        throw new Err('You cannot join a game that has already begun.');
    }

    if (!colors.includes(color)) {
        throw new Err(`You must choose an one of ${colors}.`);
    }

    if (game.players[color]) {
        throw new Err('This color is already taken.');
    }

    game.ref.child('players').child(color).set(createPlayer(user));

    this.response.end(JSON.stringify({success: true}));
}

module.exports = { createPlayer, joinGame, colors };
