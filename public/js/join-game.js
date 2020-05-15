var joinGame = (function() {
    var db = firebase.database().ref('/');

    return function(color) {
        return authorize().then(function() {
            return api('joinGame', { color: color });
        }).catch(function(err) {
            showError('Error Joining Game:', err);
        });
    };
})();
