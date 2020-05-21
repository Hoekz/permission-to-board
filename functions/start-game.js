const { cardFromDeck } = require('./actions');

const HAND_SIZE = 4;

function startGame() {
    const game = this.request.game;
    const order = randomPlayerOrder(Object.keys(game.players));

    game.ref.child('order').set(order);

    game.ref.child('current').set({
        player: order[0],
        action: 0
    });

    distributeHands(order, game);
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

        for(let i = 0; i < HAND_SIZE; i++) {
            hand[cardFromDeck(game)]++;
        }

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
