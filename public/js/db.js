var db = (function() {
    var baseRef = firebase.database().ref('/');
    var watching = null;
    var user = null;

    function loggedInAs() {
        for (var i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('firebase:authUser') > -1) {
                return JSON.parse(localStorage.getItem(localStorage.key(i)));
            }
        }
    }

    function simpleName(name) {
        var parts = name.split(' ');
        var last = parts.pop();

        return parts.join(' ') + ' ' + last[0];
    }

    function mapPlayers(players) {
        var mapped = {};

        for (var color in players) {
            mapped[color] = {
                uid: players[color].uid,
                name: simpleName(players[color].name),
                color: color,
                score: 0,
                trains: players[color].trains,
                hand: players[color].hand || {},
                routes: players[color].routes
            };
        }

        return mapped;
    }

    function isGame(id) {
        return new Promise(function(resolve) {
            baseRef.child(parseId(id)).once('value', function(snapshot) {
                var game = snapshot.val();
                resolve(game);
            });
        });
    }

    function watchGame(id, onUpdate) {
        if (watching) {
            baseRef.child(watching).off();
        }

        watching = parseId(id);

        baseRef.child(watching).on('value', function(snapshot) {
            var game = snapshot.val();

            if (!game) {
                return console.warn('Game not currently available');
            }

            user = user || loggedInAs();

            console.log(game);

            var mappedPlayers = mapPlayers(game.players);
            var me = Object.values(mappedPlayers).find(function(player) {
                return user && player.uid === user.uid;
            });

            onUpdate({
                started: game.started,
                key: simplifyId(watching),
                current: game.current,
                board: game.board,
                order: game.order,
                players: mappedPlayers,
                slots: game.display,
                me: me,
                isMyTurn: me && game.current && me.color === game.current.player
            });
        });
    }

    function parseId(id) {
        if (id.length > 4) return id;
        var parsed = [];

        id.toUpperCase().split('').forEach(function(char) {
            parsed.push({
                A: 'alpha', B: 'bravo', C: 'charlie', D: 'delta', E: 'echo',
                F: 'foxtrot', G: 'golf', H: 'hotel', I: 'india', J: 'juliett'
            }[char] || char);
        });

        return parsed.join('-');
    }

    function simplifyId(id) {
        if (id.length == 4) return id;
        var simple = '';
        id.split('-').forEach(function(code){
            simple += {
                alpha: 'A', bravo: 'B', charlie: 'C', delta: 'D', echo: 'E',
                foxtrot: 'F', golf: 'G', hotel: 'H', india: 'I', juliett: 'J',
            }[code] || code;
        });

        return simple;
    }

    return {
        isGame: isGame,
        watchGame: watchGame,
        parseId: parseId,
        simplifyId: simplifyId
    }
})();
