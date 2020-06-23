
const dom = {
    players: $$('[players]'),
    tokens: $$('[tokens]'),
    key: $$('[key]'),
    joinSearch: $('[join] [search]'),
    joinFind: $('[join] [find]'),
    displaySearch: $('[display] [search]'),
    displayFind: $('[display] [find]'),
    displayBoard: $('[display] [board]'),
    hand: $$('[hand]'),
    routes: $$('[routes][view]'),
    routeOpts: $('[routes][choose]'),
    deck: $$('[deck]'),
    start: $('[start]'),
    selected: $('[selected]'),
    game: $('[game]'),
    gameBoard: $('[game] [board]'),
    onTurn: $('[on-turn]')
};

const cardColors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'locomotive', 'black', 'white'];

const withElement = (fn) => (el, ...args) => typeof el === 'string' ? fn(dom[el], ...args) : fn(el, ...args);

const update = withElement((el, children) => {
    if (el instanceof Array) {
        return el.forEach(item => update(item, children));
    }

    if (typeof children === 'string') {
        return el.innerHTML = children;
    }

    el.innerHTML = '';
    children.forEach(child => el.appendChild(child.cloneNode(true)));
});

const onClick = withElement((el, listener) => {
    el.addEventListener('click', listener);
    return el;
});

const value = withElement((el) => el.value);
const show = withElement((el) => el.removeAttribute('hide'));
const hide = withElement((el) => el.setAttribute('hide', ''));

function text(str, attr = '') {
    const el = document.createElement('span');
    attr.split(' ').filter(a => a).forEach((a) => el.setAttribute(a, ''));
    el.innerHTML = str;
    return el;
}

function button(color, label, onClick) {
    const el = document.createElement('button');

    el.innerHTML = label;
    el.setAttribute('btn', '');
    el.setAttribute(color, '');
    el.addEventListener('click', onClick);

    return el;
}

function token(color) {
    const el = document.createElement('button');

    el.setAttribute('token', '');
    el.setAttribute(color, '');

    return el;
}

function group(children) {
    const el = document.createElement('div');
    children.forEach((child) => el.appendChild(child));
    return el;
}

function player(color, player, isCurrent) {
    const el = document.createElement('div');
    el.setAttribute('player', '');

    el.appendChild(group([token(color), text(player.name)]));
    el.appendChild(group([
        text(player.score || 0, 'score info'),
        text(player.trains, 'train-count info')
    ]));

    if (isCurrent) {
        el.setAttribute('active', '');
    }

    return el;
}

function endPlayer(color, player) {
    const el = document.createElement('div');
    el.setAttribute('player', '');

    el.appendChild(group([token(color), text(player.name)]));
    el.appendChild(group([
        text('', player.winner ? 'crown' : ''),
        text('', player.hasLongestTrain ? 'train-count' : ''),
        text(player.score, 'info')
    ]));

    return el;
}

function card(color, count) {
    const el = document.createElement('div');

    el.setAttribute(color, '');
    el.setAttribute('card', '');

    if (typeof count === 'number') {
        el.appendChild(text(count));
    }

    return el;
}

function routeCard(route) {
    const el = document.createElement('div');
    el.setAttribute('route', '');

    if (route.completed) {
        el.setAttribute('completed', '');
    }

    el.appendChild(text(route.start, 'start'));
    el.appendChild(text(route.end, 'end'));
    el.appendChild(text(route.worth, 'worth'));

    return el;
}

function newRouteCard(key) {
    const el = document.createElement('div');
    el.setAttribute('new', '');
    el.setAttribute('route', '');

    el.appendChild(text('+', 'worth'));

    el.addEventListener('click', () => api.getRoutes({ key: db.parseId(key) }));

    return el;
}

function select(route, key) {
    if (!route) {
        return dom.selected.setAttribute('hide', '');
    }

    dom.selected.innerHTML = '';

    const play = button('green', 'Play', () => {
        if (route.color !== 'any') {
            return api.playPath({
                key: key, start: route.start, end: route.end
            }).then(selectNone);
        }

        db.currentGame.routeToBePlayed = route;
        onUpdate(db.currentGame);
        router.update('/game/hand');
    });

    if (!db.currentGame.isMyTurn) {
        play.setAttribute('disabled', '');
    }

    const cancel = button('red', 'Cancel', selectNone);

    dom.selected.appendChild(text('From: ' + route.start));
    dom.selected.appendChild(text('To: ' + route.end));
    dom.selected.appendChild(text('Requires: ' + route.length + ' ' + route.color));

    if (route.occupant) {
        dom.selected.appendChild(text('Owner: ' + route.occupant));
    } else {
        dom.selected.appendChild(play);
    }

    dom.selected.appendChild(cancel);
    dom.selected.removeAttribute('hide');
}

function selectNone() {
    select(null);
    draw.highlight({ x: -10000, y: -10000 });
}

function notHidden(el) {
    return el === document.body || (!el.hasAttribute('hide') && notHidden(el.parentElement));
}

function leaveGame() {
    if (confirm('Are you sure you want to leave the game?')) {
        localStorage.removeItem('game-key');
        db.stopWatching();
        router.update('/landing');
    }
}

function onUpdate(game) {
    db.currentGame = game;

    if (game.started) {
        if (router.route() === '/join/share') {
            router.update('/game');
        }

        update('onTurn', game.lastTurn ? 'Last Turn!' : 'Your Turn');

        if (game.routeToBePlayed) {
            update('onTurn', 'Choose a color to play. Locomotives will be used as necessary.');
        }

        if (game.started === 'finished') {
            if (router.route().startsWith('/game')) {
                router.update('/game/scores');
            }

            update('onTurn', 'Game Over!');
            update('players', [
                ...game.order.map(color => endPlayer(color, game.players[color])),
                button('red', 'Leave Game', leaveGame)
            ]);
        } else {
            update('players', [
                ...game.order.map(color => player(color, game.players[color], color === game.current.player)),
                button('red', 'Leave Game', leaveGame)
            ]);
        }

        if (game.me) {
            update('hand', cardColors.map(color => game.routeToBePlayed
                ? onClick(card(color, game.me.hand[color] || 0), (e) => {
                    e.target.setAttribute('active', '');

                    api.playPath({
                        key: db.parseId(game.key),
                        start: game.routeToBePlayed.start,
                        end: game.routeToBePlayed.end,
                        color: color
                    }).then((function() {
                        option.removeAttribute('active');
                        selectNone();
                    }));
                })
                : card(color, game.me.hand[color] || 0)
            ));

            update('routes', [
                ...game.me.routes.map(routeCard),
                newRouteCard(game.key),
            ]);

            const needToChoose = game.me.routes.some(route => !route.chosen);

            if (needToChoose) {
                let chosen = [];

                function toggle(route, card) {
                    if (chosen.includes(route)) {
                        chosen = chosen.filter(r => r !== route);
                        card.removeAttribute('chosen');
                    } else {
                        chosen = [...chosen, route];
                        card.setAttribute('chosen', '');
                    }
                }

                update('routeOpts', [
                    ...game.me.routes(route => onClick(routeCard(route), (e) => toggle(route, e.target))),
                    button('green', 'Choose Routes', () => {
                        if (!chosen.length) {
                            return alert('You have not chosen any routes.');
                        }
    
                        if (game.me.routes.length < 4 && chosen.length < 2) {
                            return alert('You must choose at least 2 routes to start.');
                        }
    
                        api.chooseRoutes({ key: db.parseId(game.key), routes: JSON.stringify(chosen) });
                    })
                ]);

                show(dom.routeOpts);
            } else {
                hide(dom.routeOpts);
            }
        }

        update('deck', [
            ...Object.keys(game.slots).map((slot) => onClick(card(game.slots[slot]), (e) => {
                e.target.setAttribute('active', '');
                api.takeCard({ key: db.parseId(game.key), slot: slot })
                    .then(() => e.target.removeAttribute('active'));
            })),
            onClick(card('back'), () => api.drawCard({ key: db.parseId(game.key) }))
        ]);

        if (game.isMyTurn || game.started === 'finished') {
            dom.game.setAttribute('my-turn', '');
        } else {
            dom.game.removeAttribute('my-turn');
        }
    } else {
        const key = game.key || dom.joinSearch.value;

        update('tokens', colors
            .filter(color => color in game.players)
            .map(color => onClick(token(color), () => api.joinGame({ key: db.parseId(key), color: color })))
        );

        update('players', [
            ...game.order.map(color => player(color, game.players[color], false)),
            button('red', 'Leave Game', leaveGame)
        ]);

        if (Object.keys(game.players).length > 1) {
            dom.start.removeAttribute('disabled');
        } else {
            dom.start.setAttribute('disabled', '');
        }

        if (game.me && router.route().includes('/color')) {
            router.update(router.route().replace('/color', '/share'));
        }
    }

    update('key', game.key);

    if (router.route().startsWith('/game')) {
        attachDragEvents(dom.gameBoard, db.parseId(game.key));
        draw.surface(dom.gameBoard.getContext('2d'));
    }

    if (router.route().startsWith('/display')) {
        console.log('drawing to display');
        attachDragEvents(dom.displayBoard, db.parseId(game.key));
        draw.surface(dom.displayBoard.getContext('2d'));
    }

    draw.size(game.board.size)
        .cities(game.board.points)
        .paths(game.board.connections)
        .update();

    localStorage.setItem('game-key', game.key);
}

onClick('joinFind', () => {
    const key = value('joinSearch');

    if (!key.match(/^[A-Z]{4}$/i)) {
        return popup('Enter a 4 character game key.');
    }

    db.isGame(key).then((game) => {
        if (!game || (game.started && !game.me)) {
            return popup('Game not found or has already started.');
        }

        localStorage.setItem('game-key', game.key);
        db.watchGame(key, onUpdate);
        router.update(game.started ? '/game' : '/join/color');
    });
});

onClick('displayFind', () => {
    const key = value('displaySearch');

    if (!key.match(/^[A-Z]{4}$/i)) {
        return popup('Enter a 4 character game key.');
    }

    db.isGame(key).then((game) => {
        if (!game) {
            return popup('Game not found.');
        }

        localStorage.setItem('game-key', game.key);
        db.watchGame(key, onUpdate);
        router.update('/display/game');
    });
});

onClick('start', () => {
    const key = localStorage.getItem('game-key');

    if (!key) {
        alert('No game key found.');
        return router.update('/landing');
    }

    api.startGame({ key: db.parseId(key) }).then(() => router.update('/game'));
});

router.onStart(() => {
    const key = localStorage.getItem('game-key');
    const version = localStorage.getItem('app-version');

    if (key) {
        db.isGame(key).then((game) => {
            if (!game || game.started === 'finished') {
                db.stopWatching();
                return router.update('/landing');
            }

            db.watchGame(key, onUpdate);
        });
    }

    db.version().then((dbVersion) => {
        if (version && version !== dbVersion) {
            localStorage.removeItem('app-version');
            window.location.reload(true);
        } else {
            localStorage.setItem('app-version', dbVersion);
        }
    });

    show(document.body);

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/install.js');
});

router.onEnter('/create/color', () => {
    authorize();

    const colors = ['red', 'yellow', 'green', 'blue', 'black'];

    update('tokens', colors.map((color) => onClick(token(color), () => api.createGame({ color: color })
        .then((res) => {
            db.watchGame(res.key, onUpdate);
            router.update('/create/share');
        })
    )));
});

router.onEnter('/landing', () => {
    document.body.setAttribute('style', 'animation: scroll linear 120s infinite;');
    localStorage.removeItem('game-key');
});

router.onLeave('/landing', () => document.body.removeAttribute('style'));

router.onEnter('/join/find', authorize);
router.onEnter('/display/find', authorize);

function resetRoute() {
    if (db.currentGame) {
        delete db.currentGame.routeToBePlayed;
        dom.onTurn.innerHTML = db.currentGame.started === 'finished' ? 'Game Over' : 'Your Turn';
    }
}

function back(color) {
    const el = $$('[game] [nav] [' + color + ']')[0];
    el.oldRoute = el.getAttribute('nav-to');
    el.oldText = el.innerHTML;

    return () => {
        el.innerHTML = 'Back';
        el.setAttribute('nav-to', '/game');
    }
}

const reset = (color) => () => {
    const el = $$('[game] [nav] [' + color + ']')[0];

    resetRoute();
    el.innerHTML = el.oldText;
    el.setAttribute('nav-to', el.oldRoute);
};

router.onEnter('/game/scores', back('red'));
router.onEnter('/game/hand', back('yellow'));
router.onEnter('/game/deck', back('green'));
router.onEnter('/game/routes', back('blue'));

router.onLeave('/game/scores', reset('red'));
router.onLeave('/game/hand', reset('yellow'));
router.onLeave('/game/deck', reset('green'));
router.onLeave('/game/routes', reset('blue'));

window.onerror = (msg, src, line, col) => api.log({ log: src + ' ' + line + ':' + col + ' -- ' + msg });
