var showError = (function() {
    var errorLog = bind('error-log');

    return function(message, details) {
        var err = document.createElement('div');
        err.classList.add('error');
        err.innerHTML = '<div class="message">' + message + '</div>' +
                        '<div class="details">' + details + '</div>';

        errorLog.append(err);
    };
})();
