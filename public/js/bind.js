var bind = (function() {
    var global = {};
    var references = {};
    var methods = {
        'value': 'body',
        'enable-if': 'enable',
        'disable-if': 'disable',
        'show-if': 'show',
        'hide-if': 'hide'
    };

    document.body.context = global;

    function get(key, obj) {
        obj = obj || global;

        var parts = key.split('.');

        if (parts.length === 1) {
            var target = obj[key];

            return target instanceof Function ? target(global) : target;
        }

        return get(parts.slice(1).join('.'), obj[parts[0]]);
    }

    function elem(el) {
        if (!el) return null;

        el.showListeners = el.showListeners || [];
        var newElem = {
            raw: el,
            val: function(v) {
                if (v) el.value = v;
                return el.value;
            },
            body: function(b) {
                if (b instanceof Function) return el._body = b.bind(newElem);
                if (b !== undefined && b !== el.innerHTML) el.innerHTML = b;
                return el.innerHTML;
            },
            eval: function() {
                for (var method in methods) {
                    var attr = el.getAttribute(method);

                    if (attr) {
                        newElem[methods[method]](get(attr));
                    }
                }

                slice(el.children).map(elem).forEach(function(el) {
                    el.eval();
                });
            },
            hide: function(should) {
                if (should || should === undefined) {
                    el.setAttribute('hide', '');
                } else {
                    newElem.show();
                }
            },
            show: function(should) {
                if (should || should === undefined) {
                    el.showListeners.forEach(function(listener) {
                        listener();
                    });
                    el.removeAttribute('hide');
                } else {
                    newElem.hide();
                }
            },
            disable: function(should) {
                if (should || should === undefined) {
                    el.setAttribute('disabled', '');
                } else {
                    newElem.enable();
                }
            },
            enable: function(should) {
                if (should || should === undefined) {
                    el.removeAttribute('disabled');
                } else {
                    newElem.disable();
                }
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
                    el.showListeners.push(listener.bind(newElem, global));
                } else {
                    el.addEventListener(event, listener.bind(newElem, global));
                }
            },
            get: function(attr) {
                return el.getAttribute(attr);
            },
            // only used for app
            context: function() {
                return global;
            },
            model: function(key, value) {
                global[key] = value;
                newElem.eval();
                ref.self.saveState();
            },
            navTo: function(url) {
                updateRoute(url, global);
            },
            saveState: function() {
                localStorage.setItem(ref.self.get('ref'), JSON.stringify(global));
            },
            loadState: function(fn) {
                var state = JSON.parse(localStorage.getItem(ref.self.get('ref')) || 'null');

                if (state) {
                    for (key in state) {
                        global[key] = state[key];
                    }
                }

                if (fn) {
                    fn(global);
                }

                return state;
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

        global.route = lastRoute = location.hash.slice(1);
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
        $$('[action]').forEach(function(el) {
            el.on('click', function(e) {
                global[el.get('action')](el.get('value') || el.get('ref'), global);
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
