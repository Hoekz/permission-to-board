
function slice(arr) {
    var newArr = [];
    for(var i = 0; i < arr.length; i++) newArr.push(arr[i]);
    return newArr;
}

function $$(selector) {
    return slice(document.querySelectorAll(selector));
}

var router = (function() {
    var routes = {};
    var lastRoute = '';

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

        $$('[route]').forEach(function(el) {
            if (url.indexOf(el.getAttribute('route')) === 0) {
                el.removeAttribute('hide');
            } else {
                el.setAttribute('hide', '');
            }
        });

        if (routes[lastRoute] && routes[lastRoute].leave) {
            routes[lastRoute].leave();
        }

        lastRoute = location.hash.slice(1);

        if (routes[lastRoute] && routes[lastRoute].enter) {
            routes[lastRoute].enter();
        }
    }

    window.addEventListener('load', function() {
        bindRoutes();
        updateRoute(location.hash.slice(1) || '/');
    });

    window.addEventListener('hashchange', function() {
        if (lastRoute !== location.hash.slice(1)) {
            updateRoute(location.hash.slice(1));
        }
    });

    return {
        onEnter: function(url, fn) {
            routes[url] = routes[url] || {};
            routes[url].enter = fn;
        },
        onLeave: function(url, fn) {
            routes[url] = routes[url] || {};
            routes[url].leave = fn;
        },
        route: function() { return lastRoute; },
        update: updateRoute
    };
})();
