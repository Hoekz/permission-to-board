var bind = (function() {
    var global = {};

    document.body.context = global;

    function parse(exp, el, ctx) {
        try {
            return eval('(function($el, model) { return ' + exp + '})(el, ctx)');
        } catch(e) {
            showError('Eval Error', e);
        }
    }

    var references = {};

    function elem(el) {
        if (!el) return showError('Must pass Element, passed: ', el);

        el.showListeners = el.showListeners || [];
        var newElem = {
            raw: el,
            val: function(v) {
                if (v) el.value = v;
                return el.value;
            },
            body: function(b) {
                if (b) el.innerHTML = b;
                return el.innerHTML;
            },
            eval: function(ctx) {
                ctx = ctx || newElem.context();
                var validator = el.getAttribute('if');
                var expression = el.getAttribute('eval');

                if (validator) {
                    if (!parse(validator, el, ctx)) return newElem.hide();
                    newElem.show();
                }

                if (expression) {
                    var val = parse(expression, el, ctx);
                    el.innerHTML = val;
                    el.value = val;
                }

                slice(el.children).map(elem).forEach(function(el) {
                    el.eval(ctx);
                });
            },
            hide: function() {
                el.setAttribute('hide', '');
            },
            show: function(lastContext) {
                el.showListeners.forEach(function(listener) {
                    listener(lastContext);
                });
                el.removeAttribute('hide');
            },
            ref: function(sub) {
                if (sub) return ref(sub, el);

                var ptr = el;
                var chain = [];

                while (ptr != document.body) {
                    chain.push(ptr);
                    ptr = ptr.parentElement;
                }

                return chain.map(function(e) {
                    return e.getAttribute('ref');
                }).filter(function(ref) {
                    return ref;
                }).reverse().join('.');
            },
            append: function(child) {
                el.appendChild(child.raw || child);
            },
            on: function(event, listener) {
                if (event === 'show') {
                    el.showListeners.push(listener.bind(newElem));
                } else {
                    el.addEventListener(event, listener.bind(newElem));
                }
            },
            get: function(attr) {
                return el.getAttribute(attr);
            },
            context: function() {
                return el.context || elem(el.parentElement).context();
            },
            model: function(key, value) {
                if (!el.context) {
                    var ctx = function() {};
                    ctx.prototype = elem(el.parentElement).context();
                    el.context = new ctx();
                }

                el.context[key] = value;

                if(value instanceof Function) {
                    el.context[key] = value.bind(newElem);
                } else {
                    newElem.eval()
                }
            },
            navTo: function(url) {
                updateRoute(url, el.context);
            },
            saveState: function(data) {
                localStorage.setItem(newElem.ref(), JSON.stringify(data));
            },
            loadState: function() {
                return JSON.parse(localStorage.getItem(newElem.ref()) || 'null');
            }
        };

        return newElem;
    }

    function $(css, base = document.body) {
        return elem(base.querySelector(css));
    }

    function $$(css, base = document.body) {
        return slice(base.querySelectorAll(css)).map(elem);
    }

    function ref(pattern, base = document.body) {
        if (base === document.body) {
            if (!(pattern in references)) {
                references[pattern] = $('[ref=' + pattern.split('.').join('] [ref=') + ']', base);
            }

            return references[pattern];
        }

        return $('[ref=' + pattern.split('.').join('] [ref=') + ']', base);
    }

    function bindRoutes() {
        $$('[nav-to]').forEach(function(el) {
            el.on('click', function() {
                location.hash = el.get('nav-to');
            });
        });
    }

    var lastRoute = '';

    function updateRoute(url, lastContext) {
        if (url === '/' ||  url === '#' || url === '') {
            url = '/' + $('[route][default]').ref().split('.').join('/');
        }

        if (url[0] !== '/') {
            url = '/' + url;
        }

        if (location.hash.slice(1) !== url) {
            history.pushState(null, null, '#' + url);
        }

        var ref = url.split('/').slice(1).join('.');

        $$('[route]').forEach(function(el) {
            if (ref.startsWith(el.ref())) {
                el.show(lastContext);
            } else {
                el.hide();
            }
        });

        lastRoute = location.hash.slice(1);
    }

    var templates = {};

    function loadTemplates() {
        $$('script[type="template"]').forEach(function(el) {
            templates[el.get('ref')] = el.body();
        });
    }

    function applyTemplates() {
        $$('[template]').forEach(function(el) {
            el.body(templates[el.get('ref')]);
        });
    }

    function applyListeners() {
        $$('[on-click]').forEach(function(el) {
            el.on('click', function(e) {
                parse(el.get('on-click'), el, el.context());
            });
        });
    }

    var readyQueue = [];
    function ready() {
        readyQueue.forEach(function(func) { func() });
    }

    window.addEventListener('load', function() {
        [
            bindRoutes, loadTemplates, applyTemplates, applyListeners,
            ready, updateRoute.bind(null, location.hash.slice(1) || '/'),
            elem(document.body).eval,
            elem(document.body).show
        ].forEach(function(func) {
            try {
                func();
            }catch(e){
                showError('Error in Setup:', e);
            }
        });
    });

    window.addEventListener('hashchange', function() {
        if (lastRoute === location.hash.slice(1)) return;
        updateRoute(location.hash.slice(1));
    });

    ref.model = function(key, value) {
        global[key] = value;
    };

    ref.on = function(event, listener) {
        if (event == 'ready') {
            readyQueue.push(listener);
        }
    };

    ref.self = elem(document.body);

    return ref;
})();

function slice(arr) {
    var newArr = [];
    for(var i = 0; i < arr.length; i++) newArr.push(arr[i]);
    return newArr;
}
