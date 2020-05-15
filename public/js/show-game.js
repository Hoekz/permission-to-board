var showGame = (function() {
    var canvas, ctx, deck, scores, base;

    function setup() {
        base = this;
        canvas = this.ref('canvas');
        ctx = canvas.raw.getContext('2d');
        deck = this.ref('deck');
        scores = this.ref('scores');
    }

    function bindDeck() {
        var drawPile = deck.ref('draw-pile');

        this.deck.on('value', function(snapshot) {
            console.log(snapshot.val());
            console.log('UPDATE DISPLAYED CARDS');
        });

        deck.on('click', function(event) {
            console.log(event.target);
            console.log('PLAYER CHOOSES CARD');
        });
    }

    function bindBoard() {
        canvas.on('click', function(e) {
            base.model('selected', draw.highlight({
                x: e.clientX,
                y: e.clientY
            }));
        });

        draw.surface(ctx);

        this.board.on('value', function(snapshot) {
            var all = snapshot.val();
            console.log(all);

            draw.size(all.size);
            draw.cities(all.points);
            draw.paths(all.connections);
        });
    }

    function bindPlayers() {
        this.players.on('value', function(snapshot) {
            console.log(snapshot.val());
            console.log('PLAYER HAS UPDATED');
        });
    }

    return function(game, base) {
        authorize()
        .then(setup.bind(base))
        .then(bindDeck.bind(game))
        .then(bindBoard.bind(game))
        .then(bindPlayers.bind(game));
    };
})();
