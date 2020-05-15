bind.on('ready', function() {
    bind('create.color.tokens').model('choose', function(choice) {
        var self = this;

        self.model('choice', choice);
        createGame(choice).then(function(gameData) {
            self.model('key', gameData.id);
        }).then(function() {
            self.navTo('/create/share');
        });
    });

    bind('create.share').on('show', function(lastContext) {
        if (lastContext && lastContext.key) {
            this.model('key', lastContext.key);
            this.model('shareableKey', db.simplifyId(lastContext.key));
        } else {
            this.navTo('/landing');
        }
    });

    bind('join.find.check').on('click', function() {
        db.getGame(bind('join.find.key').val()).then(function(game) {
            if (!game) {
                bind('join.find').model('error', 'Cannot Find Game');
                bind('join.find.error').show();
            } else {
                bind('join.find').model('game', game);
                bind('join.find').navTo('/game');
            }
        });
    });

    bind('display.find.check').on('click', function() {
        db.getGame(bind('display.find.key').val()).then(function(game) {
            if (!game) {
                bind('display.find').model('error', 'Cannot Find Game');
                bind('display.find.error').show();
            } else {
                bind('display.find').model('game', game);
                bind('display.find').navTo('/display/show');
            }
        });
    });

    bind('display.show').on('show', function(lastContext) {
        var self = this;

        if (!lastContext) {
            lastContext = self.loadState();
        }

        if (!lastContext) {
            return self.navTo('/landing');
        }

        (lastContext.game ? Promise.resolve(lastContext.game) : db.getGame(lastContext.key))
        .then(function(game) {
            if(!game) {
                return self.navTo('/landing');
            }

            self.saveState({
                key: game.key
            });

            showGame(game, self);
        })
    });
});
