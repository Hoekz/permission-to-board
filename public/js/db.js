const db = (function() {
    const baseRef = firebase.database().ref('/');
    let watching = null;
    let user = null;

    function loggedInAs() {
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).indexOf('firebase:authUser') > -1) {
                return JSON.parse(localStorage.getItem(localStorage.key(i)));
            }
        }
    }

    function simpleName(name) {
        const parts = name.split(' ');
        const last = parts.pop();

        return parts.join(' ') + ' ' + last[0];
    }

    const points = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };

    function scorePlayer(routes, color) {
        return routes.reduce((score, route) => {
            if (route.occupant === color) {
                return score + points[route.length];
            }

            return score;
        }, 0);
    }

    function mapPlayers(players, routes) {
        const mapped = {};

        const max = { color: [], score: -1 };

        for (let color in players) {
            const score = scorePlayer(routes, color) + (players[color].routeBonus || 0) + (players[color].longestTrainBonus || 0);

            mapped[color] = {
                uid: players[color].uid,
                name: simpleName(players[color].name),
                color: color,
                score: score,
                trains: players[color].trains,
                hand: players[color].hand || {},
                routes: players[color].routes || [],
                hasLongestTrain: 'longestTrainBonus' in players[color]
            };

            if (score === max.score) {
                max.color.push(color);
            }

            if (score > max.score) {
                max.color = [color];
                max.score = score;
            }
        }

        for (let i = 0; i < max.color.length; i++) {
            mapped[max.color[i]].winner = true;
        }

        return mapped;
    }

    function mapGame(snapshot, key) {
        const game = snapshot.val();

        if (!game) {
            return console.warn(`Game '${key}' not currently available`);
        }

        user = user || loggedInAs();

        const mappedPlayers = mapPlayers(game.players, game.board.connections);
        const me = Object.values(mappedPlayers).find((player) => user && player.uid === user.uid);

        return {
            started: game.started,
            key: simplifyId(key),
            current: game.current,
            board: game.board,
            order: game.order,
            players: mappedPlayers,
            slots: game.display,
            me: me,
            isMyTurn: me && game.current && me.color === game.current.player,
            lastTurn: Object.values(game.players).some((player) => player.lastTurn)
        };
    }

    function isGame(id) {
        stopWatching();
        return new Promise(function(resolve) {
            baseRef.child(parseId(id)).once('value', function(snapshot) {
                resolve(mapGame(snapshot, id));
            });
        });
    }

    function watchGame(id, onUpdate) {
        stopWatching();
        watching = parseId(id);

        baseRef.child(watching).on('value', function(snapshot) {
            const data = mapGame(snapshot, id);
            if (data) onUpdate(data);
        });
    }

    function stopWatching() {
        if (watching) {
            baseRef.child(watching).off();
            localStorage.removeItem('game-key');
        }

        watching = null;
    }

    function parseId(id) {
        if (id.length > 4) return id;
        const parsed = [];

        id.toUpperCase().split('').forEach(function(char) {
            parsed.push({
                A: 'alpha', B: 'bravo', C: 'charlie', D: 'delta', E: 'echo',
                F: 'foxtrot', G: 'golf', H: 'hotel', I: 'india', J: 'juliett',
                K: 'kilo', L: 'lima', M: 'mike', N: 'november', O: 'oscar', P: 'papa',
                Q: 'quebec', R: 'romeo', S: 'sierra', T: 'tango', U: 'uniform',
                V: 'victor', W: 'whiskey', X: 'xray', Y: 'yankee', Z: 'zulu'
            }[char] || char);
        });

        return parsed.join('-');
    }

    function simplifyId(id) {
        if (id.length == 4) return id;

        return id.split('-').map((code) => {
            return {
                alpha: 'A', bravo: 'B', charlie: 'C', delta: 'D', echo: 'E',
                foxtrot: 'F', golf: 'G', hotel: 'H', india: 'I', juliett: 'J',
                kilo: 'K', lima: 'L', mike: 'M', november: 'N', oscar: 'O', papa: 'P',
                quebec: 'Q', romeo: 'R', sierra: 'S', tango: 'T', uniform: 'U',
                victor: 'V', whiskey: 'W', xray: 'X', yankee: 'Y', zulu: 'Z'
            }[code] || code;
        }).join('');
    }

    function version() {
        return new Promise((resolve) => {
            baseRef.child('version').once('value', (snapshot) => resolve(snapshot.val()));
        });
    }

    return {
        isGame: isGame,
        watchGame: watchGame,
        stopWatching: stopWatching,
        parseId: parseId,
        simplifyId: simplifyId,
        version: version
    }
})();
