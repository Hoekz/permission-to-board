const { endGame } = require('./end-game');
const { Err, rand } = require('./utility');

function mine() {
    const game = this.request.game;

    if (!game.started) {
        throw new Err('The game has not started.');
    }

    if (game.players[game.current.player].uid !== this.request.user.uid) {
        throw new Err('It is not your turn!');
    }

    if (game.started === 'finished') {
        throw new Err('The game is over!');
    }

    return this.request.game.current.action;
}

function cardFromDeck(game) {
    let cards = Object.keys(game.deck).reduce((deck, color) => [
        ...deck, ...Array(game.deck[color]).fill(color)
    ], []);

    let card = cards[rand(cards.length)];

    game.ref.child(`deck/${card}`).set(game.deck[card] - 1);

    return card;
}

function take(action) {
    if (action > 1) {
        throw new Err('Cannot pick up after previous action.');
    }
    
    const slot = parseInt(this.request.query.slot.replace('slot-', ''));
    
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

        game.ref.child('deck/locomotive').set(game.deck.locomotive + path.length);
        refHand.child('locomotive').set(hand.locomotive - path.length);
        refHand.parent.child('trains').set(player.trains - path.length);
        game.ref.child(`board/connections/${index}/occupant`).set(game.current.player);
        skip.call(this);
        return this.response.end('{"success": "route played."}');
    }

    if (path.length  > hand[choice.color]) {
        game.ref.child('deck/locomotive').set(game.deck.locomotive + path.length - hand[choice.color]);
        game.ref.child(`deck/${choice.color}`).set(game.deck[choice.color] + hand[choice.color]);
        hand.locomotive -= path.length - hand[choice.color];
        hand[choice.color] = 0;
    } else {
        game.ref.child(`deck/${choice.color}`).set(game.deck[choice.color] + path.length);
        hand[choice.color] -= path.length;
    }

    player.trains -= path.length;

    refHand.child('locomotive').set(hand.locomotive);
    refHand.child(choice.color).set(hand[choice.color]);
    refHand.parent.child('trains').set(player.trains);
    game.ref.child(`board/connections/${index}/occupant`).set(game.current.player);
    skip.call(this);
    this.response.end('{"success": "route played."}');
}

function getRoutes(action) {
    // TODO: return 3 routes
    if (action) {
        throw new Err('Cannot play after previous action.');
    }

    const game = this.request.game;
    const routes = game.routes.slice(0, 3);
    game.routes = game.routes.slice(3);

    const allRoutes = [...game.players[game.current.player].routes, ...routes];
    game.ref.child('routes').set(game.routes);
    game.ref.child(`players/${game.current.player}/routes`).set(allRoutes);
    game.ref.child('current/action').set(2);

    if (this.response) {
        this.response.end('{"success": "you have received 3 route cards."}');
    }
}

function chooseRoutes(action) {
    if (action !== 2) {
        throw new Err('Cannot filter routes after previous action.');
    }

    const game = this.request.game;
    const chosen = JSON.parse(this.request.query.routes);

    if (!(chosen instanceof Array)) {
        throw new Err('You must send in an array of routes.');
    }

    if (!chosen.every(r => r.start && r.end)) {
        throw new Err('Invalid formed routes in array, must have properties start and end.');
    }

    const routes = game.players[game.current.player].routes;
    const choosable = routes.filter(r => !r.chosen);
    const inRoutes = choosable.filter(c => chosen.some(r =>  r.start === c.start && r.end === c.end));

    if (chosen.length !== inRoutes.length) {
        throw new Err('You must choose from the routes you were given.');
    }

    if (routes.length === 3 && inRoutes.length < 2) {
        throw new Err('You must choose at least 2 routes on your first turn.');
    }

    game.routes = [...game.routes, ...choosable.filter(c => inRoutes.includes(c))];

    inRoutes.forEach(route => route.chosen = true);

    game.ref.child(`players/${game.current.player}/routes`).set(routes.filter(r => r.chosen));
    game.ref.child('routes').set(game.routes);
    skip.call(this);

    this.response.end('{"success": "routes chosen."}');
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

    if (!game.players[game.order[next]].routes) {
        game.ref.child(`players/${game.order[next]}/routes`).set(game.routes.slice(0, 3));
        game.ref.child('routes').set(game.routes.slice(3));
        game.ref.child('current/action').set(2);
    }
}

module.exports = { mine, take, draw, play, skip, cardFromDeck, getRoutes, chooseRoutes };
