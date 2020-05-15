var db = require("firebase-admin").database();

function Err(msg) {
    this.message = msg;
}

function mine() {
    if (this.request.game.current.player !== this.request.user.uid) {
        throw new Err('It is not your turn!');
    }

    return this.request.game.current.action;
}

function cardFromDeck(game) {
    let cards = Object.keys(game.deck).filter(function(color) {
        return game.deck[color] > 0;
    });

    let card = cards[Math.floor(cards.length * Math.random())];

    game.ref.child(`deck/${card}`).set(game.deck[card] - 1);

    return card;
}

function take(action) {
    let game = this.request.game;

    if (game.current.action > 1) {
        throw new Err('Cannot pick up after previous action.');
    }

    let slot = parseInt(this.request.query.slot);

    if (isNaN(slot) || slot < 1 || slot > 5) {
        throw new Err('Invalid slot to choose card from.');
    }

    let card = game.display['slot-' + slot];

    if (card === 'locomotive' && game.current.action) {
        throw new Err('Cannot choose locomotive on second draw.');
    }

    game.ref.child(`players/${game.current.player}/hand/${card}`)
    .set(game.players[game.current.player].hand[card] + 1);

    game.ref.child(`display/slot-${slot}`).set(cardFromDeck(game));

    if (card === 'locomotive' || game.current.action) {
        skip.call(this);
    } else {
        game.ref.child('current/action').set(1);
    }

    this.response.end('{"success": "card added to hand."}');
}

function draw(action) {
    let game = this.request.game;

    if (game.current.action > 1) {
        throw new Err('Cannot draw after previous action.');
    }

    let card = cardFromDeck(game);

    game.ref.child(`players/${game.current.player}/hand/${card}`)
    .set(game.players[game.current.player].hand[card] + 1);

    if (game.current.action === 1) {
        skip.call(this);
    } else {
        game.ref.child('current/action').set(1);
    }

    this.response.end('{"success": "card added to hand."}');
}

function play(action) {
    if (action) {
        throw new Err('Cannot play after previous action.');
    }

    let game = this.request.game;
    let choice = this.request.query;

    let path = game.board.connections.find(function(c) {
        return c.start === choice.start && c.end === choice.end;
    });

    if (!path) {
        throw new Err(`No path exists between ${choice.start} and ${choice.end}`);
    }

    if (path.occupant) {
        throw new Err('Path is already taken.');
    }

    if (path.color !== 'any') {
        choice.color = path.color;
    }

    let hand = game.players[game.current.player].hand;
    let refHand = game.ref.child(`players/${game.current.player}/hand/`)

    if (hand[choice.color] + hand.locomotive < path.length) {
        throw new Err('You do not have enough to play here.');
    }

    if (choice.color === 'locomotive') {
        if (hand.locomotive < path.length) {
            throw new Err('You do not have enough to play here.');
        }

        refHand.child('locomotive').set(hand.locomotive - path.length);
        return skip(null);
    }

    path.length -= hand[choice.color];

    if (path.length > 0) {
        hand.locomotive -= path.length;
        hand[choice.color] = 0;
    } else {
        hand[choice.color] = -path.length;
    }

    refHand.child('locomotive').set(hand.locomotive);
    refHand.child(choice.color).set(hand[choice.color]);

    return skip(null);
}

function skip(action) {
    let ref = this.request.game.ref;

    let i = this.request.game.order.indexOf(this.request.game.current.color) + 1;

    if (i === this.request.game.order.length) {
        i = 0;
    }

    let nextPlayer = this.request.game.order[i];

    ref.child('current').set({
        player: nextPlayer,
        action: 0
    });
}

module.exports = { mine, take, draw, play, skip, cardFromDeck };
