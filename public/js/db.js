var db = (function() {
    var baseRef = firebase.database().ref('/');
    var watching = null;

    function isGame(id) {
        return new Promise(function(resolve) {
            baseRef.child(parseId(id)).once('value', function(snapshot) {
                resolve(snapshot.val() !== null);
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

            onUpdate({
                started: game.started,
                key: watching,
                order: game.order,
                players: game.players,
                slots: game.slots,
                me: game.players.find(function(player) {
                    return player;
                })
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
