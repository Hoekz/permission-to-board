
function slice(arr) {
    var newArr = [];
    for(var i = 0; i < arr.length; i++) newArr.push(arr[i]);
    return newArr;
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => slice(document.querySelectorAll(selector));

const router = (function() {
    const routes = {};
    const lastRoute = localStorage.getItem('last-route') || '';
    let onload = () => {};

    function bindRoutes() {
        $$('[nav-to]').forEach(function(el) {
            el.addEventListener('click', function() {
                location.hash = el.getAttribute('nav-to');
            });
        });
    }

    function updateRoute(url) {
        if (url === '/' ||  url === '#' || url === '') {
            url = '/landing';
        }

        if (url[0] !== '/') {
            url = '/' + url;
        }

        if (location.hash.slice(1) !== url) {
            history.pushState(null, null, '#' + url);
        }

        $$('[page]').forEach(function(el) {
            if (url.indexOf(el.getAttribute('page')) === 0) {
                el.removeAttribute('hide');
            } else {
                el.setAttribute('hide', '');
            }
        });

        if (routes[lastRoute] && routes[lastRoute].leave) {
            routes[lastRoute].leave();
        }

        lastRoute = location.hash.slice(1);
        localStorage.setItem('last-route', lastRoute);

        if (routes[lastRoute] && routes[lastRoute].enter) {
            routes[lastRoute].enter();
        }
    }

    window.addEventListener('load', () => {
        bindRoutes();
        onload();
        updateRoute(location.hash.slice(1) || '/');
    });

    window.addEventListener('hashchange', () => {
        if (lastRoute !== location.hash.slice(1)) {
            updateRoute(location.hash.slice(1));
        }
    });

    if (lastRoute) {
        updateRoute(lastRoute);
    }

    return {
        onEnter: (url, fn) => {
            routes[url] = routes[url] || {};
            routes[url].enter = fn;
        },
        onLeave: (url, fn) => {
            routes[url] = routes[url] || {};
            routes[url].leave = fn;
        },
        onStart: (fn) => onload = fn,
        route: () => lastRoute,
        update: updateRoute
    };
})();
