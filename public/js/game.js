
var dom = {
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
};

function text(str, attr) {
    var el = document.createElement('span');
    if (attr) {
        el.setAttribute(attr, '');
    }
    el.innerHTML = str;
    return el;
}

function button(color, label, onClick) {
    var el = document.createElement('button');

    el.innerHTML = label;
    el.setAttribute('btn', '');
    el.setAttribute(color, '');
    el.addEventListener('click', onClick);

    return el;
}

function token(color) {
    var el = document.createElement('button');

    el.setAttribute('token', '');
    el.setAttribute(color, '');

    return el;
}

function group(children) {
    var el = document.createElement('div');

    children.forEach(function(child) {
        el.appendChild(child);
    });

    return el;
}

function player(color, name, score, trains, isCurrent) {
    var el = document.createElement('div');
    el.setAttribute('player', '');

    el.appendChild(group([token(color), text(name)]));
    el.appendChild(group([text(score, 'score'), text(trains, 'train-count')]));

    if (isCurrent) {
        el.setAttribute('active', '');
    }

    return el;
}

function card(color, count) {
    var el = document.createElement('div');

    el.setAttribute(color, '');
    el.setAttribute('card', '');

    if (typeof count === 'number') {
        el.appendChild(text(count));
    }

    return el;
}

function routeCard(start, end, worth, completed) {
    var startEl = text(start);
    startEl.className = 'start';

    var endEl = text(end);
    endEl.className = 'end';

    var worthEl = text(worth);
    worthEl.className = 'worth';

    var el = document.createElement('div');
    el.className = completed ? 'route completed' : 'route';
    el.appendChild(startEl);
    el.appendChild(endEl);
    el.appendChild(worthEl);

    return el;
}

function newRouteCard() {
    var el = document.createElement('div');
    el.className = 'new route';

    var worthEl = text('+');
    worthEl.className = 'worth';

    el.appendChild(worthEl);

    return el;
}

function select(route, key) {
    if (!route) {
        return dom.selected.setAttribute('hide', '');
    }

    dom.selected.innerHTML = '';

    var play = button('green', 'Play', function() {
        api.playPath({ key: key, start: route.start, end: route.end });
    });

    if (!db.currentGame.isMyTurn) {
        play.setAttribute('disabled', '');
    }

    var cancel = button('red', 'Cancel', function() {
        dom.selected.setAttribute('hide', '');
        draw.highlight({ x: -10000, y: -10000 });
    });

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

function notHidden(el) {
    return el === document.body || (!el.hasAttribute('hide') && notHidden(el.parentElement));
}

var rendered = false;
function onUpdate(game) {
    db.currentGame = game;

    if (game.started) {
        dom.players.forEach(function(el) {
            el.innerHTML = '';
            
            for(let i = 0; i < game.order.length; i++) {
                var color = game.order[i];
                var isCurrent = color === game.current.player;
                var details = game.players[color];
    
                el.appendChild(player(color, details.name, details.score, details.trains, isCurrent))
            }
        });
    
        dom.hand.forEach(function(el) {
            el.innerHTML = '';

            if (!game.me) {
                return;
            }

            var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'locomotive', 'black', 'white'];
    
            for (var i = 0; i < colors.length; i++) {
                el.appendChild(card(colors[i], game.me.hand[colors[i]] || 0));
            }
        });

        dom.routes.forEach(function(el) {
            el.innerHTML = '';

            if (!game.me) {
                return;
            }

            for (var i = 0; i < game.me.routes.length; i++) {
                var route = game.me.routes[i];

                if (route.chosen) {
                    el.appendChild(routeCard(route.start, route.end, route.worth, route.completed));
                }
            }

            el.appendChild(newRouteCard());
        });

        dom.routeOpts.forEach(function(el) {
            if (!game.me) {
                return;
            }

            var needsToChoose = false;
            var chosen = [];
            function toggle(route, card) {
                var found = false;

                for(var i = 0; i < chosen.length; i++) {
                    if (chosen[i] === route) {
                        found = true;
                        chosen.splice(i, 1);
                        card.className = 'route';
                        break;
                    }
                }

                if (!found) {
                    card.className = 'chosen route';
                    chosen.push(route);
                }
            }
            el.innerHTML = '';

            for (var i = 0; i < game.me.routes.length; i++) {
                var route = game.me.routes[i];

                if (!route.chosen) {
                    needsToChoose = true;
                    var now = routeCard(route.start, route.end, route.worth);
                    now.addEventListener('click', toggle.bind(null, route, now));
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
                }))
            } else {
                el.setAttribute('hide', '');
            }
        });
    
        dom.deck.forEach(function(el) {
            el.innerHTML = '';
    
            for (var slot in game.slots) {
                var option = card(game.slots[slot]);
                option.addEventListener('click', api.takeCard.bind(null, { key: db.parseId(game.key), slot: slot }));
                el.appendChild(option);
            }

            var back = card('back');
            back.addEventListener('click', api.drawCard.bind(null, { key: db.parseId(game.key) }));
            el.appendChild(back);
        });

        if (game.isMyTurn) {
            dom.game.setAttribute('my-turn', '');
        } else {
            dom.game.removeAttribute('my-turn');
        }
    } else {
        dom.tokens.forEach(function(el) {
            var key = game.key || dom.joinSearch.value;
            el.innerHTML = '';
    
            colors = ['red', 'yellow', 'green', 'blue', 'black'];
    
            for (var i = 0; i < colors.length; i++) {
                var color = colors[i];
                if (!(color in game.players)) {
                    var colorToken = token(color);
                    el.appendChild(colorToken);
                    colorToken.addEventListener('click', api.joinGame.bind(null, { key: db.parseId(key), color: color }));
                }
            }
        });

        dom.players.forEach(function(el) {
            el.innerHTML = '';
            
            for(var color in game.players) {
                var details = game.players[color];
    
                el.appendChild(player(color, details.name, '', details.trains, false))
            }
        });

        if (Object.keys(game.players).length > 1) {
            dom.start.removeAttribute('disabled');
        }

        if (game.me && router.route().indexOf('color') > -1) {
            router.update(router.route().replace('/color', '/share'));
        }
    }

    dom.key.forEach(function(el) {
        el.innerHTML = game.key;
    });

    dom.board.forEach(function(el) {
        if (!rendered && notHidden(el)) {
            attachDragEvents(el, db.parseId(game.key));

            draw.surface(el.getContext('2d'));
            draw.size(game.board.size);
            draw.cities(game.board.points);
            rendered = true;
        }
        
        draw.paths(game.board.connections);
    });


    localStorage.setItem('game-key', game.key);
}

dom.joinFind.addEventListener('click', function() {
    var key = dom.joinSearch.value;

    if (!key || key.length !== 4) {
        return alert('Enter a 4 character game key.');
    }

    db.isGame(key).then(function(game) {
        if (!game && !game.started) {
            return alert('Game not found or has already started.');
        }

        db.watchGame(key, onUpdate);
        router.update('/join/color');
    });
});

dom.displayFind.addEventListener('click', function() {
    var key = dom.displaySearch.value;

    if (!key || key.length !== 4) {
        return alert('Enter a 4 character game key.');
    }

    db.isGame(key).then(function(isGame) {
        if (!isGame) {
            return alert('Game not found.');
        }

        db.watchGame(key, onUpdate);
        router.update('/display/game');
    });
});

dom.start.addEventListener('click', function() {
    var key  = localStorage.getItem('game-key');

    if (!key) {
        return router.update('/landing');
    }

    api.startGame({ key: db.parseId(key) }).then(function() {
        router.update('/game');
    });
});

window.addEventListener('load', function() {
    var key = localStorage.getItem('game-key');

    if (key) {
        db.watchGame(key, onUpdate);
    }

    document.body.removeAttribute('hide');
});

function createGame(color) {
    return function() {
        api.createGame({ color: color }).then(function(res) {
            db.watchGame(res.key, onUpdate);
            router.update('/create/share');
        });
    }
}

router.onEnter('/create/color', function() {
    dom.tokens.forEach(function(el) {
        el.innerHTML = '';

        colors = ['red', 'yellow', 'green', 'blue', 'black'];
    
        for (var i = 0; i < colors.length; i++) {
            var color = colors[i];
            var colorToken = token(color);
            el.appendChild(colorToken);
            colorToken.addEventListener('click', createGame(color));
        }
    });
});

router.onEnter('/landing', function() {
    document.body.setAttribute('style', 'animation: scroll linear 120s infinite;');
});

router.onLeave('/landing', function() {
    document.body.removeAttribute('style');
});

function back(color) {
    var el = $$('[game] [nav] [' + color + ']')[0];
    el.oldRoute = el.getAttribute('nav-to');
    el.oldText = el.innerHTML;
    return function() {
        el.innerHTML = 'Back';
        el.setAttribute('nav-to', '/game');
    }
}

function reset(color) {
    var el = $$('[game] [nav] [' + color + ']')[0];
    return function() {
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
    api.log({ log: src + ' ' + line + ':' + col + ' -- ' + message });
}
