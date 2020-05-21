var api = (function() {
    var baseUrl = location.href.indexOf('localhost') > -1
        ? 'http://localhost:1234/permission-to-board/us-central1/'
        : 'https://us-central1-permission-to-board.cloudfunctions.net/';
    var loading = bind('loading');

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
            loading.hide();
            try {
                resolve(JSON.parse(xhr.responseText));
            } catch(e) {
                resolve(xhr.responseText);
            }
        };

        loading.show();

        authorize().then(function(user) {
            return user.getToken();
        }).then(function(token) {
            xhr.open('GET', baseUrl + func + parameterize(params));
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send();
        });

        return promise;
    }
})();

[
    'createGame', 'joinGame', 'startGame',
    'takeCard', 'drawCard', 'playPath', 'skipTurn'
]
.forEach(function(action) {
    api[action] = function(params) {
        return api(action, params).catch(function(e) {
            showError('Error during ' + action + ':', e);
        });
    };
});
