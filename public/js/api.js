var api = (function() {
    var baseUrl = 'https://us-central1-permission-to-board.cloudfunctions.net/';
    var loading = bind('loading');

    function parameterize(params) {
        var urlParams = [];

        for (var key in params) {
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
