var createGame = (function() {
    var db = firebase.database().ref('/');

    return function(color) {
        return authorize().then(function() {
            return api('createGame', { color: color });
        }).catch(function(err) {
            showError('Error Creating Game:', err);
        });
    };
})();
