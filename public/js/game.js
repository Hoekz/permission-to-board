
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
    myTurn: $$('[is-my-turn]')
};

function text(str) {
    var el = document.createElement('span');
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
    var el = document.createElement('div');

    el.setAttribute('token', '');
    el.setAttribute(color, '');

    return el;
}

function player(color, name, score, isCurrent) {
    var el = document.createElement('div');

    el.appendChild(token(color));
    el.appendChild(text(name));
    el.appendChild(text(score));

    if (isCurrent) {
        el.setAttribute('active', '');
    }

    return el;
}

function card(color, count) {
    var el = document.createElement('div');

    el.setAttribute(color, '');
    el.setAttribute('card', '');

    if (count) {
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

function select(route, key) {
    if (!route) {
        return;
    }

    dom.selected.innerHTML = '';

    var play = button('green', 'Play', function() {
        api.playPath({ key: key, start: route.start, end: route.end });
    });

    var cancel = button('red', 'Cancel', function() {
        dom.selected.setAttribute('hide', '');
    });

    dom.selected.appendChild(text('From: ' + route.start));
    dom.selected.appendChild(text('To: ' + route.end));
    dom.selected.appendChild(text('Requires: ' + route.length + ' ' + route.color));
    dom.selected.appendChild(play);
    dom.selected.appendChild(cancel);
    dom.selected.removeAttribute('hide');
}

var rendered = false;
function onUpdate(game) {
    if (game.started) {
        dom.players.forEach(function(el) {
            el.innerHTML = '';
            
            for(let i = 0; i < game.order.length; i++) {
                var color = game.order[i];
                var isCurrent = color === game.current.player;
                var details = game.players[color];
    
                el.appendChild(player(color, details.name, details.score, isCurrent))
            }
        });
    
        dom.hand.forEach(function(el) {
            el.innerHTML = '';

            if (!game.me) {
                return;
            }
    
            for (var color in game.me.hand) {
                el.appendChild(card(color, game.me.hand[color]));
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
        });

        dom.routeOpts.forEach(function(el) {
            if (!game.me) {
                return;
            }

            var needsToChoose = false;
            var chosen = [];
            function toggle(route) {
                var found = false;

                for(var i = 0; i < chosen.length; i++) {
                    if (chosen[i] === route) {
                        found = true;
                        chosen.splice(i, 1);
                        break;
                    }
                }

                if (!found) {
                    chosen.push(route);
                }
            }
            el.innerHTML = '';

            for (var i = 0; i < game.me.routes.length; i++) {
                var route = game.me.routes[i];

                if (!route.chosen) {
                    needsToChoose = true;
                    var now = routeCard(route.start, route.end, route.worth);
                    now.addEventListener('click', choose.bind(null, route));
                    el.appendChild(now);
                }

            }

            if (needsToChoose) {
                el.appendChild(button('green', 'Choose Routes', function() {
                    if (!chosen.length) {
                        return alert('You have not chosen any routes.');
                    }

                    if (!game.me.routes.length && chosen.length < 2) {
                        return alert('You must choose at least 2 routes to start.');
                    }

                    api.chooseRoutes({ key: game.key, routes: JSON.stringify(chosen) });
                }))
            }
        });
    
        dom.deck.forEach(function(el) {
            el.innerHTML = '';
    
            var back = card('back');
            back.addEventListener('click', api.drawCard.bind(null));
            el.appendChild(back);
    
            for (var slot in game.slots) {
                var option = card(game.slots[slot]);
                option.addEventListener('click', api.takeCard.bind(null, { key: game.key, slot: slot }));
                el.appendChild(option);
            }
        });

        dom.isMyTurn.forEach(function(el) {
            if (game.me && game.current && game.current.player !== game.me.color) {
                el.setAttribute('hide', '');
            } else {
                el.removeAttribute('hide');
            }
        });
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
                    colorToken.addEventListener('click', api.joinGame.bind(null, { key: key, color: color }));
                }
            }
        });
    
        dom.key.forEach(function(el) {
            el.innerHTML = game.key;
        });
    }

    dom.board.forEach(function(el) {
        if (!rendered) {
            el.addEventListener('click', function(e) {
                select(draw.highlight({ x: e.clientX, y: e.clientY }), game.key);
            });

            draw.surface(el.getContext('2d'));
            draw.size(game.board.sze);
            draw.cities(game.board.points);
        }
        
        draw.paths(game.board.connections);
    });

    rendered = true;
}

dom.joinFind.addEventListener('click', function() {
    var key = dom.joinSearch.value;

    if (!key || key.length !== 4) {
        return alert('Enter a 4 character game key.');
    }

    db.isGame(key).then(function(isGame) {
        if (!isGame) {
            return alert('Game not found.');
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
