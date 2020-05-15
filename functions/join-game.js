let colors = ['red', 'yellow', 'green', 'blue', 'black'];

function Err(msg) {
    this.message = msg;
}

function createPlayer(user) {
    return {
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

    if (colors.indexOf(color) < 0) {
        throw new Err(`You must choose an one of ${colors}.`);
    }

    if (game.players[color]) {
        throw new Err('This color is already taken.');
    }

    let players = game.ref.child('players');

    players.child(user.uid).set(createPlayer(user));
    players.child(color).set(user.uid);

    this.response.end(JSON.stringify({success: true}));
}

module.exports = { createPlayer, joinGame };
