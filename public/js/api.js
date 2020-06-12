var api = (function() {
    var baseUrl = location.href.indexOf('localhost') > -1
        ? 'http://localhost:1234/permission-to-board/us-central1/'
        : 'https://us-central1-permission-to-board.cloudfunctions.net/';
    var loading = $$('[loading]')[0];

    function parameterize(params) {
        var urlParams = [];

        for (var key in params) {
            if (params[key] instanceof Object || key === 'route') continue;
            urlParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }

        return '?' + urlParams.join('&');
    }

    return function(func, params = {}) {
        var resolve, reject;
        var promise = new Promise(function(res, rej) {resolve = res; reject = rej;});

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            loading.setAttribute('hide', '');
            if (xhr.status === 400) {
                return reject(JSON.parse(xhr.responseText));
            }

            try {
                resolve(JSON.parse(xhr.responseText));
            } catch(e) {
                resolve(xhr.responseText);
            }
        };

        authorize().then(function(user) {
            return user.getToken();
        }).then(function(token) {
            xhr.open('GET', baseUrl + func + parameterize(params));
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send();
            loading.removeAttribute('hide');
        }).catch(function(e) {
            loading.setAttribute('hide', '');
            throw e;
        });

        return promise;
    }
})();

[
    'createGame', 'joinGame', 'startGame',  'log',
    'takeCard', 'drawCard', 'playPath', 'skipTurn', 'getRoutes', 'chooseRoutes'
]
.forEach(function(action) {
    api[action] = function(params) {
        return api(action, params).catch(function(e) {
            console.log(e);
            alert(e.message);
        });
    };
});
