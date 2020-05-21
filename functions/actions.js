const { endGame } = require('./end-game');
const { Err } = require('./utility');

function mine() {
    const game = this.request.game;

    if (game.players[game.current.player].uid !== this.request.user.uid) {
        throw new Err('It is not your turn!');
    }

    if (game.started === 'finished') {
        throw new Err('The game is over!');
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
    if (action > 1) {
        throw new Err('Cannot pick up after previous action.');
    }
    
    const slot = parseInt(this.request.query.slot);
    
    if (isNaN(slot) || slot < 1 || slot > 5) {
        throw new Err('Invalid slot to choose card from.');
    }
    
    const game = this.request.game;
    const card = game.display['slot-' + slot];

    if (card === 'locomotive' && action) {
        throw new Err('Cannot choose locomotive on second draw.');
    }

    game.ref.child(`players/${game.current.player}/hand/${card}`).set(game.players[game.current.player].hand[card] + 1);

    game.ref.child(`display/slot-${slot}`).set(cardFromDeck(game));

    if (card === 'locomotive' || action) {
        skip.call(this);
    } else {
        game.ref.child('current/action').set(1);
    }

    this.response.end('{"success": "card added to hand."}');
}

function draw(action) {
    if (action > 1) {
        throw new Err('Cannot draw after previous action.');
    }

    const game = this.request.game;
    const card = cardFromDeck(game);

    game.ref.child(`players/${game.current.player}/hand/${card}`).set(game.players[game.current.player].hand[card] + 1);

    if (action === 1) {
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

    const game = this.request.game;
    const choice = this.request.query;
    const path = game.board.connections.find(c => c.start === choice.start && c.end === choice.end);
    const index = game.board.connections.indexOf(path);

    if (!path) {
        throw new Err(`No path exists between ${choice.start} and ${choice.end}`);
    }

    if (path.occupant) {
        throw new Err('Path is already taken.');
    }

    const isDouble = game.board.connections.find(c => c.start === choice.end && c.end === choice.start);

    if (isDouble && isDouble.occupant === game.current.player) {
        throw new Err('You cannot take both paths between 2 cities.');
    }

    if (path.color !== 'any') {
        choice.color = path.color;
    }

    const player = game.players[game.current.player];
    const hand = player.hand;
    const refHand = game.ref.child(`players/${game.current.player}/hand/`);

    if (hand[choice.color] + hand.locomotive < path.length) {
        throw new Err('You do not have enough to play here.');
    }

    if (choice.color === 'locomotive') {
        if (hand.locomotive < path.length) {
            throw new Err('You do not have enough to play here.');
        }

        refHand.child('locomotive').set(hand.locomotive - path.length);
        game.ref.child(`board/connections/${index}/occupant`).set(game.current.player);
        skip.call(this);
        return this.response.end('{"success": "route played."}');
    }

    if (path.length  > hand[choice.color]) {
        hand.locomotive -= path.length - hand[choice.color];
        hand[choice.color] = 0;
    } else {
        hand[choice.color] -= path.length;
    }

    player.trains -= path.length;

    refHand.child('locomotive').set(hand.locomotive);
    refHand.child(choice.color).set(hand[choice.color]);
    refHand.parent().child('trains').set(player.trains);
    game.ref.child(`board/connections/${index}/occupant`).set(game.current.player);
    skip.call(this);
    this.response.end('{"success": "route played."}');
}

function skip() {
    const game = this.request.game;
    const next = (game.order.indexOf(game.current.player) + 1) % game.order.length;

    if (game.players[game.current.player].lastTurn) {
        return endGame(game);
    }

    if (game.players[game.current.player].trains < 3) {
        game.ref.child(`players/${game.current.player}/lastTurn`).set(true);
    }
    
    game.ref.child('current').set({
        player: game.order[next],
        action: 0
    });
}

module.exports = { mine, take, draw, play, skip, cardFromDeck };
