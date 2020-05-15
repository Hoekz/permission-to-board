var draw = (function() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var surface = null;
    var cities = {};
    var paths = [];
    var size = {x: 0, y: 0};
    var showNames = true;
    var click = {x: 0, y: 0};
    var selected = null;
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

    function drawPath(start, pts, end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);

        pts.forEach(function(pt) {
            ctx.lineTo(pt.x, pt.y);
        });

        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        pts.forEach(function(pt) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, ctx.lineWidth / 2 + 4, 0, 2 * Math.PI, false);
            ctx.fill();
        });
    }

    function draw() {
        selected = null;
        if (!size.x || !size.y) {
            console.log('WARNING: size must have positive x and y values.');
            return;
        }

        canvas.width = size.x;
        canvas.height = size.y;
        ctx.clearRect(0, 0, size.x, size.y);

        paths.forEach(function(path) {
            var isDbl = paths.find(function(p) {
                return p.start === path.end && p.end === path.start;
            });

            var pts = arc(cities[path.start], cities[path.end], path.length, isDbl);

            if (onPath(pts, click.x, click.y) && !selected) {
                ctx.strokeStyle = ctx.fillStyle = (path.color == 'black') ? '#fff' : '#000';
                ctx.lineWidth = 8;
                drawPath(cities[path.start], pts, cities[path.end]);
                selected = path;
            }

            ctx.strokeStyle = ctx.fillStyle = colors[path.color];
            ctx.lineWidth = 4;

            drawPath(cities[path.start], pts, cities[path.end]);
        });

        Object.keys(cities).forEach(function(name) {
            var city = cities[name];
            ctx.drawImage(img, city.x - 10, city.y - 10);

            if (showNames) {
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                name = name.split(' ').map(function(s) {
                    return s[0].toUpperCase() + s.substr(1);
                }).join(' ');
                ctx.strokeText(name, city.x + 8 - 40 * city.x / size.x, city.y - 16);
                ctx.fillText(name, city.x + 8 - 40 * city.x / size.x, city.y - 16);
            }
        });

        if (surface) {
            var w = surface.canvas.width = window.innerWidth;
            var h = surface.canvas.height = window.innerHeight;
            surface.drawImage(canvas, (w - size.x) / 2, (h - size.y) / 2, size.x, size.y);
        }

        return selected;
    }

    function drawAfter(f) {
        return function() {
            f.apply(null, arguments);
            return draw();
        }
    }

    return {
        size: drawAfter(function(s) { size = s; }),
        surface: drawAfter(function(s) { surface = s; }),
        cities: drawAfter(function(c) { cities = c; }),
        paths: drawAfter(function(p) { paths = p; }),
        showNames: drawAfter(function(b) { showNames = b; }),
        highlight: drawAfter(function(p) {
            click = p;
            var w = surface.canvas.width = window.innerWidth;
            var h = surface.canvas.height = window.innerHeight;
            click.x -= (w - size.x) / 2;
            click.y -= (h - size.y) / 2;
        }),
        selected: function() { return selected; }
    };
})();
