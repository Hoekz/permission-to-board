
const dom = {
    players: $$('[players]'),
    tokens: $$('[tokens]'),
    key: $$('[key]'),
    joinSearch: $$('[join] [search]')[0],
    joinFind: $$('[join] [find]')[0],
    displaySearch: $$('[display] [search]')[0],
    displayFind: $$('[display] [find]')[0],
    board: $$('[board]'),
    hand: $$('[hand]'),
    routes: $$('[routes][view]'),
    routeOpts: $$('[routes][choose]'),
    deck: $$('[deck]'),
    start: $$('[start]')[0],
    selected: $$('[selected]')[0],
    game: $$('[game]')[0],
    onTurn: $$('[on-turn]')[0],
};

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

function player(color, name, score, trains, isCurrent) {
    const el = document.createElement('div');
    el.setAttribute('player', '');

    el.appendChild(group([token(color), text(name)]));
    el.appendChild(group([text(score || 0, 'score info'), text(trains, 'train-count info')]));

    if (isCurrent) {
        el.setAttribute('active', '');
    }

    return el;
}

function endPlayer(color, name, score, longest, winner) {
    const el = document.createElement('div');
    el.setAttribute('player', '');

    el.appendChild(group([token(color), text(name)]));
    el.appendChild(group([text('', winner ? 'crown' : ''), text('', longest ? 'train-count' : ''), text(score, 'info')]));

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

function routeCard(start, end, worth, completed) {
    const el = document.createElement('div');
    el.setAttribute('route', '');

    if (completed) {
        el.setAttribute('completed', '');
    }

    el.appendChild(text(start, 'start'));
    el.appendChild(text(end, 'end'));
    el.appendChild(text(worth, 'worth'));

    return el;
}

function newRouteCard(key) {
    const el = document.createElement('div');
    el.setAttribute('new', '');
    el.setAttribute('route', '');

    el.appendChild(text('+', 'worth'));

    el.addEventListener('click', api.getRoutes.bind(null, { key: db.parseId(key) }));

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

        if (game.routeToBePlayed) {
            dom.onTurn.innerHTML = 'Choose a color to play. Locomotives will be used as necessary.';
        } else {
            dom.onTurn.innerHTML = game.lastTurn ? 'Last Turn!' : 'Your Turn';
        }

        if (game.started === 'finished') {
            if (router.route().startsWith('/game')) {
                router.update('/game/scores');
            }
    
            dom.onTurn.innerHTML = 'Game Over!';
            dom.players.forEach((el) => {
                el.innerHTML = '';
                
                for(let i = 0; i < game.order.length; i++) {
                    const color = game.order[i];
                    const details = game.players[color];
        
                    el.appendChild(endPlayer(color, details.name, details.score, details.hasLongestTrain, details.winner));
                }

                el.appendChild(button('red', 'Leave Game', leaveGame));
            });
        } else {
            dom.players.forEach((el) => {
                el.innerHTML = '';
                
                for(let i = 0; i < game.order.length; i++) {
                    const color = game.order[i];
                    const isCurrent = color === game.current.player;
                    const details = game.players[color];
        
                    el.appendChild(player(color, details.name, details.score, details.trains, isCurrent))
                }

                el.appendChild(button('red', 'Leave Game', leaveGame));
            });
        }

    
        dom.hand.forEach((el) => {
            el.innerHTML = '';

            if (!game.me) {
                return;
            }

            const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'locomotive', 'black', 'white'];
    
            for (const color of colors) {
                const option = card(color, game.me.hand[color] || 0);

                if (game.routeToBePlayed) {
                    option.addEventListener('click', () => {
                        option.setAttribute('active', '');

                        api.playPath({
                            key: db.parseId(game.key),
                            start: game.routeToBePlayed.start,
                            end: game.routeToBePlayed.end,
                            color: color
                        }).then((function() {
                            option.removeAttribute('active');
                            selectNone();
                        }));
                    });
                }

                el.appendChild(option);
            }
        });

        dom.routes.forEach((el) => {
            el.innerHTML = '';

            if (!game.me || !game.me.routes) {
                return;
            }

            for (const route of game.me.routes) {
                if (route.chosen) {
                    el.appendChild(routeCard(route.start, route.end, route.worth, route.completed));
                }
            }

            el.appendChild(newRouteCard(game.key));
        });

        dom.routeOpts.forEach((el) => {
            if (!game.me || !game.me.routes) {
                return;
            }

            let needsToChoose = false;
            const chosen = [];

            function toggle(route, card) {
                let found = false;

                for(let i = 0; i < chosen.length; i++) {
                    if (chosen[i] === route) {
                        found = true;
                        chosen.splice(i, 1);
                        card.removeAttribute('chosen');
                        break;
                    }
                }

                if (!found) {
                    card.setAttribute('chosen', '');
                    chosen.push(route);
                }
            }

            el.innerHTML = '';

            for (const route of game.me.routes) {
                if (!route.chosen) {
                    needsToChoose = true;
                    const now = routeCard(route.start, route.end, route.worth);
                    now.addEventListener('click', () => toggle(route, now));
                    el.appendChild(now);
                }
            }

            if (needsToChoose) {
                el.appendChild(button('green', 'Choose Routes', function() {
                    if (!chosen.length) {
                        return alert('You have not chosen any routes.');
                    }

                    if (game.me.routes.length < 4 && chosen.length < 2) {
                        return alert('You must choose at least 2 routes to start.');
                    }

                    api.chooseRoutes({ key: db.parseId(game.key), routes: JSON.stringify(chosen) });
                }));

                el.removeAttribute('hide');
            } else {
                el.setAttribute('hide', '');
            }
        });
    
        dom.deck.forEach((el) => {
            el.innerHTML = '';
    
            for (const slot in game.slots) {
                const option = card(game.slots[slot]);
                const action = api.takeCard.bind(null, {
                    key: db.parseId(game.key),
                    slot: slot
                });

                option.addEventListener('click', () => {
                    option.setAttribute('active', '');
                    action().then(() => option.removeAttribute('active'));
                });

                el.appendChild(option);
            }

            const back = card('back');
            back.addEventListener('click', api.drawCard.bind(null, { key: db.parseId(game.key) }));
            el.appendChild(back);
        });

        if (game.isMyTurn || game.started === 'finished') {
            dom.game.setAttribute('my-turn', '');
        } else {
            dom.game.removeAttribute('my-turn');
        }
    } else {
        dom.tokens.forEach((el) => {
            const key = game.key || dom.joinSearch.value;
            el.innerHTML = '';
    
            const colors = ['red', 'yellow', 'green', 'blue', 'black'];
    
            for (const color of colors) {
                if (!(color in game.players)) {
                    const colorToken = token(color);
                    colorToken.addEventListener('click', () => api.joinGame({ key: db.parseId(key), color: color }));
                    el.appendChild(colorToken);
                }
            }
        });

        dom.players.forEach((el) => {
            el.innerHTML = '';
            
            for(const color in game.players) {
                var details = game.players[color];
    
                el.appendChild(player(color, details.name, 0, details.trains, false));
            }

            el.appendChild(button('red', 'Leave Game', leaveGame));
        });

        if (Object.keys(game.players).length > 1) {
            dom.start.removeAttribute('disabled');
        }

        if (game.me && router.route().includes('/color')) {
            router.update(router.route().replace('/color', '/share'));
        }
    }

    dom.key.forEach((el)  => el.innerHTML = game.key);

    dom.board.forEach((el) => {
        attachDragEvents(el, db.parseId(game.key));

        if (!notHidden(el)) {
            draw.surface(el.getContext('2d'));
            draw.size(game.board.size);
            draw.cities(game.board.points);
        }
        
        draw.paths(game.board.connections);
    });

    localStorage.setItem('game-key', game.key);
}

dom.joinFind.addEventListener('click', () => {
    const key = dom.joinSearch.value;

    if (!key || key.length !== 4) {
        return alert('Enter a 4 character game key.');
    }

    db.isGame(key).then((game) => {
        if (!game || (game.started && !game.me)) {
            return alert('Game not found or has already started.');
        }

        localStorage.setItem('game-key', game.key);
        db.watchGame(key, onUpdate);
        router.update(game.started ? '/game' : '/join/color');
    });
});

dom.displayFind.addEventListener('click', () => {
    const key = dom.displaySearch.value;

    if (!key || key.length !== 4) {
        return alert('Enter a 4 character game key.');
    }

    db.isGame(key).then((isGame) => {
        if (!isGame) {
            return alert('Game not found.');
        }

        localStorage.setItem('game-key', game.key);
        db.watchGame(key, onUpdate);
        router.update('/display/game');
    });
});

dom.start.addEventListener('click', () => {
    const key = localStorage.getItem('game-key');

    if (!key) {
        alert('No game key found.');
        return router.update('/landing');
    }

    api.startGame({ key: db.parseId(key) }).then(() => router.update('/game'));
});

window.addEventListener('load', () => {
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

    document.body.removeAttribute('hide');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/install.js');
    }
});

const createGame = (color) => () => {
    api.createGame({ color: color }).then((res) => {
        db.watchGame(res.key, onUpdate);
        router.update('/create/share');
    });
};

router.onEnter('/create/color', () => {
    authorize();
    dom.tokens.forEach((el) => {
        el.innerHTML = '';

        const colors = ['red', 'yellow', 'green', 'blue', 'black'];
    
        for (const color of colors) {
            var colorToken = token(color);
            colorToken.addEventListener('click', createGame(color));
            el.appendChild(colorToken);
        }
    });
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

function reset(color) {
    const el = $$('[game] [nav] [' + color + ']')[0];

    return () => {
        resetRoute();
        el.innerHTML = el.oldText;
        el.setAttribute('nav-to', el.oldRoute);
    }
}

router.onEnter('/game/scores', back('red'));
router.onEnter('/game/hand', back('yellow'));
router.onEnter('/game/deck', back('green'));
router.onEnter('/game/routes', back('blue'));

router.onLeave('/game/scores', reset('red'));
router.onLeave('/game/hand', reset('yellow'));
router.onLeave('/game/deck', reset('green'));
router.onLeave('/game/routes', reset('blue'));

window.onerror = function(msg, src, line, col) {
    api.log({ log: src + ' ' + line + ':' + col + ' -- ' + msg });
}
