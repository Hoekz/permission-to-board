bind.on('ready', function() {
    var app = bind.self;

    function watchGame(game) {
        app.model('game', game);
        var players, board, scores;

        game.board.on('value', function(snapshot) {
            app.model('board', board = snapshot.val());

            app.model('scores', scores = calculateScores(board, players));
        });

        game.players.on('value', function(snapshot) {
            app.model('players', players = snapshot.val());
        });
    };

    app.loadState(function(ctx) {
        if (!ctx.game && ctx.key) {
            db.getGame(ctx.key).then(watchGame);
        }
    });

    bind('create.share').on('show', function(ctx) {
        if (!ctx.key) {
            app.navTo('/landing');
        }
    })

    app.model('choose', function(color, ctx) {
        app.model('color', color);

        if (ctx.route.startsWith('/create')) {
            return api.createGame(ctx).then(function(game) {
                app.model('key', game.id);
                app.model('shareableKey', db.simplifyId(game.id));
                app.navTo('/create/share');
            });
        }

        api.joinGame(ctx).then(function() {
            app.navTo('/join/share');
        });
    });

    bind('join.find.check').on('click', function() {
        var id = bind('join.find.key').val();

        app.model('shareableKey', id);
        app.model('key', db.parseId(id));
        bind('join.find.error').hide();

        db.getGame(id).then(function(game) {
            if (!game) {
                bind('join.find.error').show();
            } else {
                app.model('game', game);
                app.navTo('/join/color');
            }
        });
    });

    bind('join.color.tokens').body(function(ctx) {
        if (ctx.players) {
            for(player in ctx.players) {
                var token = this.ref(player);

                if (token) {
                    token.hide();
                }
            }
        }

        return this.body();
    });

    bind('display.find.check').on('click', function() {
        var id = bind('join.find.key').val();
        
        app.model('shareableKey', id);
        app.model('key', db.parseId(id));
        bind('display.find.error').hide();

        db.getGame(id).then(function(game) {
            if (!game) {
                bind('display.find.error').show();
            } else {
                app.model('game', game);
                app.navTo('/display/show');
            }
        });
    });

    bind('display.show').on('show', function(ctx) {
        if (!ctx.key) {
            return app.navTo('/landing');
        }

        (ctx.game ? Promise.resolve(ctx.game) : db.getGame(ctx.key))
        .then(function(game) {
            if(!game) {
                app.model('game', null);
                app.model('key', '');
                app.model('shareableKey', '');
                return app.navTo('/landing');
            }

            app.model('game', game);
            showGame(game, this);
        })
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/js/install.js');
    }
});
