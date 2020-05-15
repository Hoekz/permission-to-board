var db = (function() {
    var baseRef = firebase.database().ref('/');

    function getGame(id) {
        return new Promise(function(resolve, reject) {
            var game = baseRef.child(parseId(id));

            game.once('value', function(snapshot) {
                snapshot.val() ? resolve({
                    deck: game.child('display'),
                    players: game.child('players'),
                    board: game.child('board'),
                    key: id
                }) : resolve(null);
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
        getGame: getGame,
        parseId: parseId,
        simplifyId: simplifyId
    }
})();
