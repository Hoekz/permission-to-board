const api = (function() {
    const baseUrl = location.href.indexOf('localhost') > -1
        ? 'http://localhost:1234/permission-to-board/us-central1/'
        : 'https://us-central1-permission-to-board.cloudfunctions.net/';
    const loading = $$('[loading]')[0];

    let alwaysHide;

    function parameterize(params) {
        const urlParams = [];

        for (const key in params) {
            if (params[key] instanceof Object || key === 'route') continue;
            urlParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        }

        return '?' + urlParams.join('&');
    }

    return function(func, params = {}) {
        let resolve, reject;
        const promise = new Promise(function(res, rej) {resolve = res; reject = rej;});

        clearTimeout(alwaysHide);

        const xhr = new XMLHttpRequest();

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

        alwaysHide = setTimeout(function() {
            loading.setAttribute('hide', '');
        }, 15000);

        authorize().then((user) => user.getToken()).then((token) => {
            xhr.open('GET', baseUrl + func + parameterize(params));
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.send();
            loading.removeAttribute('hide');
        }).catch((e) => {
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
.forEach((action) => api[action] = (params) => api(action, params).catch((e) => alert(e.message)));
