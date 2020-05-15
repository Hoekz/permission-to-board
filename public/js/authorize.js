var authorize = (function() {
    var user = null;
    var started = false;
    var success = [];
    var failure = [];

    function doAuth() {
        started = true;
        var provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().onAuthStateChanged(function(usr) {
            if (!usr) {
                console.log('need to login');
                firebase.auth().signInWithRedirect(provider).then(function(result) {
                    user = result.user;
                    success.forEach(function(res) {
                        res(user);
                    });
                }).catch(function(err) {
                    failure.forEach(function(rej) {
                        rej(err);
                    });
                });
            } else {
                user = usr;
                success.forEach(function(res) {
                    res(user);
                });
            }
        });
    }

    return function() {
        if (!started) doAuth();
        if (user) return Promise.resolve(user);

        return new Promise(function(res, rej) {
            success.push(res);
            failure.push(rej);
        });
    };
})();
