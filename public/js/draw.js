var draw = (function() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var surface = null;
    var cities = {};
    var paths = [];
    var scale = 1;
    var shift = {x: 0, y: 0};
    var size = {x: 0, y: 0};
    var showNames = true;
    var click = {x: 0, y: 0};
    var selected = null;
    var redraw = false;
    var shadowOfMap = null;
    var colors = {
        red:    '#a33',
        orange: '#c73',
        yellow: '#ba3',
        green:  '#393',
        blue:   '#33a',
        violet: '#92b',
        black:  '#111',
        white:  '#eee',
        any:    '#999'
    };

    var img = new Image();
    img.src = 'img/city.png';

    function center() {
        var viewport = {
            xmin: 0,
            ymin: 0,
            xmax: Math.max(window.innerWidth - 20 * 16, window.innerWidth * 0.5),
            ymax: window.innerHeight - 64
        };

        if (window.innerHeight > 500) {
            viewport.xmax = window.innerWidth;
        }

        var vcx = (viewport.xmin + viewport.xmax) / 2;
        var vcy = (viewport.ymin + viewport.ymax) / 2;

        var scx = (cities[selected.start].x + cities[selected.end].x) / 2;
        var scy = (cities[selected.start].y + cities[selected.end].y) / 2;

        var tcx = (innerWidth - size.x) / 2;
        var tcy = (innerHeight - size.y) / 2;

        shift.x = vcx - tcx - scx;
        shift.y = vcy - tcy - scy;
    }

    function drawPath(start, pts, end, occupant) {
        
        if (occupant) {
            ctx.strokeStyle = ctx.fillStyle = colors[occupant];

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);

            pts.forEach(function(pt) {
                ctx.lineTo(pt.x, pt.y);
            });

            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        } else {
            ctx.lineWidth = 2;
        }


        pts.forEach(function(pt) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, ctx.lineWidth / 2 + 4, 0, 2 * Math.PI, false);
            ctx.fill();
        });
    }

    function shadow() {
        if (!size.x || !size.y) return;

        var cvs = document.createElement('canvas');
        cvs.width = size.x;
        cvs.height = size.y;
        var shadowCtx = cvs.getContext('2d');
        shadowCtx.globalAlpha = 0.01;
        shadowCtx.fillStyle = 'black';

        for (var i = 0; i < 50; i++) {
            shadowCtx.fillRect(i, i, size.x - i * 2, size.y - i * 2);
        }

        return cvs;
    }

    function drawMap() {
        canvas.width = size.x;
        canvas.height = size.y;
        ctx.clearRect(0, 0, size.x, size.y);

        paths.forEach(function(path) {
            var isDbl = paths.find(function(p) {
                return p.start === path.end && p.end === path.start;
            });

            var pts = arc(cities[path.start], cities[path.end], path.length, isDbl);

            if (onPath(pts, click.x, click.y) && !selected) {
                ctx.fillStyle = ctx.strokeStyle = '#000';
                ctx.lineWidth = 12;
                drawPath(cities[path.start], pts, cities[path.end], 'black');
                ctx.fillStyle = ctx.strokeStyle = '#fff';
                ctx.lineWidth = 8;
                drawPath(cities[path.start], pts, cities[path.end], 'white');
                selected = path;
                center();
            }

            if (path.occupant) {
                ctx.fillStyle = ctx.strokeStyle = path.occupant === 'white' ? colors.black : colors.white;
                ctx.lineWidth = 8;
                drawPath(cities[path.start], pts, cities[path.end], path.occupant === 'white' ? 'black' : 'white');
            }

            ctx.strokeStyle = ctx.fillStyle = colors[path.color];
            ctx.lineWidth = 4;

            drawPath(cities[path.start], pts, cities[path.end], path.occupant);
        });

        Object.keys(cities).forEach(function(name) {
            var city = cities[name];
            var active = selected && (name === selected.start || name === selected.end);
            ctx.drawImage(img, city.x - 10, city.y - 10);

            if (showNames) {
                ctx.font = (active ? 20 : 12) + 'px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = active ? 3 : 2;
                name = name.split(' ').map(function(s) {
                    return s[0].toUpperCase() + s.substr(1);
                }).join(' ');
                ctx.strokeText(name, city.x + 8 - 50 * city.x / size.x, city.y - 16);
                ctx.fillText(name, city.x + 8 - 50 * city.x / size.x, city.y - 16);
            }
        });
    }

    function draw() {
        if (!size.x || !size.y) {
            console.log('WARNING: size must have positive x and y values.');
            return;
        }

        if (!shadowOfMap) {
            shadowOfMap = shadow();
        }

        if (redraw) {
            drawMap();
        }

        if (surface) {
            var w = surface.canvas.width = window.innerWidth;
            var h = surface.canvas.height = window.innerHeight;
            surface.clearRect(0, 0, w, h);
            surface.save();
            surface.translate(shift.x, shift.y);
            surface.scale(scale, scale);
            surface.drawImage(shadowOfMap, (w - size.x * 1.2) / 2, (h - size.y * 1.2) / 2, size.x * 1.2, size.y * 1.2);
            surface.drawImage(canvas, (w - size.x) / 2, (h - size.y) / 2, size.x, size.y);
            surface.restore();
        }

        redraw = true;

        return selected;
    }

    function drawAfter(f) {
        return function() {
            f.apply(null, arguments);
            return draw(shift.x, shift.y, scale);
        }
    }

    return {
        size: drawAfter(function(s) { size = s; }),
        surface: drawAfter(function(s) { surface = s; }),
        cities: drawAfter(function(c) { cities = c; }),
        paths: drawAfter(function(p) { paths = p; }),
        showNames: drawAfter(function(b) { showNames = b; }),
        highlight: drawAfter(function(p) {
            selected = null;
            click = p;
            var w = surface.canvas.width = window.innerWidth;
            var h = surface.canvas.height = window.innerHeight;
            click.x -= scale * (shift.x + (w - size.x) / 2);
            click.y -= scale * (shift.y + (h - size.y) / 2);
        }),
        selected: function() { return selected; },
        move: drawAfter(function(dx, dy) {
            shift.x += dx * scale;
            shift.y += dy * scale;
            shift.x = Math.max(-size.x / 2, Math.min(size.x / 2, shift.x));
            shift.y = Math.max(-size.y / 2, Math.min(size.y / 2, shift.y));
            redraw = false;
        }),
        zoom: drawAfter(function(dz) {
            scale *= dz;
            redraw = false;
        })
    };
})();
