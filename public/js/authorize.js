const authorize = (function() {
    let authPromise = null;

    function doAuth() {
        const provider = new firebase.auth.GoogleAuthProvider();

        let resolve, reject;
        authPromise = new Promise((res, rej) => (resolve = res, reject = rej));

        firebase.auth().onAuthStateChanged(function(user) {
            if (!user) {
                console.log('need to login');
                firebase.auth().signInWithRedirect(provider)
                    .then((result) => resolve(result.user))
                    .catch((err) => reject(err));
            } else {
                resolve(user);
            }
        });

        return authPromise;
    }

    return () => authPromise || doAuth();
})();
