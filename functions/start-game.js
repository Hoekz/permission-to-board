let { cardFromDeck } = require('./actions');

let colors = ['red', 'yellow', 'green', 'blue', 'black'];

function startGame() {
    let game = this.request.game;

    let players = randomPlayerOrder(Object.keys(game.players).filter(function(id) {
        return colors.indexOf(id) > -1;
    }));

    game.ref.child('order').set(players);

    game.ref.child('current').set({
        player: players[0],
        action: 0
    });

    distributeHands(players, game);
    layoutCardChoices(game);
    start(game);

    this.response.end('{"success": "Let the game begin!"}');
}

function randomPlayerOrder(players) {
    let original = players.slice();
    let random = [];

    while (original.length) {
        let i = Math.floor(Math.random() * original.length);
        random.push(original[i]);
        original.splice(i, 1);
    }

    return random;
}

function distributeHands(players, game) {
    players.forEach((player) => {
        let hand = {
            red: 0,
            orange: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            violet: 0,
            black: 0,
            white: 0,
            locomotive: 0
        };

        for(let i = 0; i < 4; i++) hand[cardFromDeck(game)]++;

        game.ref.child(`players/${game.players[player]}/hand`).set(hand);
    });
}

function layoutCardChoices(game) {
    game.ref.child('display/slot-1').set(cardFromDeck(game));
    game.ref.child('display/slot-2').set(cardFromDeck(game));
    game.ref.child('display/slot-3').set(cardFromDeck(game));
    game.ref.child('display/slot-4').set(cardFromDeck(game));
    game.ref.child('display/slot-5').set(cardFromDeck(game));
}

function start(game) {
    game.ref.child('started').set('fight!');
}

module.exports = { startGame };
