const draw = (function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = {x: 0, y: 0};

    let surface = null;
    let cities = {};
    let paths = [];
    let scale = 1;
    let shift = {x: 0, y: 0};
    let showNames = true;
    let click = {x: 0, y: 0};
    let selected = null;
    let redraw = false;
    let shadowOfMap = null;

    const colors = {
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

    const img = new Image();
    img.src = 'img/city.png';

    function center() {
        const viewport = {
            xmin: 0,
            ymin: 0,
            xmax: Math.max(window.innerWidth - 20 * 16, window.innerWidth * 0.5),
            ymax: window.innerHeight - 64
        };

        if (window.innerHeight > 500) {
            viewport.xmax = window.innerWidth;
        }

        const vcx = (viewport.xmin + viewport.xmax) / 2;
        const vcy = (viewport.ymin + viewport.ymax) / 2;

        const scx = (cities[selected.start].x + cities[selected.end].x) / 2;
        const scy = (cities[selected.start].y + cities[selected.end].y) / 2;

        const tcx = (innerWidth - size.x) / 2;
        const tcy = (innerHeight - size.y) / 2;

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


        pts.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, ctx.lineWidth / 2 + 4, 0, 2 * Math.PI, false);
            ctx.fill();
        });
    }

    function shadow() {
        if (!size.x || !size.y) return;

        const cvs = document.createElement('canvas');
        cvs.width = size.x;
        cvs.height = size.y;
        const shadowCtx = cvs.getContext('2d');
        shadowCtx.globalAlpha = 0.01;
        shadowCtx.fillStyle = 'black';

        for (let i = 0; i < 50; i++) {
            shadowCtx.fillRect(i, i, size.x - i * 2, size.y - i * 2);
        }

        return cvs;
    }

    function drawMap() {
        canvas.width = size.x;
        canvas.height = size.y;
        ctx.clearRect(0, 0, size.x, size.y);

        paths.forEach((path) => {
            const isDbl = paths.find((p) => p.start === path.end && p.end === path.start);
            const pts = arc(cities[path.start], cities[path.end], path.length, isDbl);

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

        Object.keys(cities).forEach((name) => {
            const city = cities[name];
            const active = selected && (name === selected.start || name === selected.end);
            const capName = name.split(' ').map((s) => s[0].toUpperCase() + s.substr(1)).join(' ');

            ctx.drawImage(img, city.x - 10, city.y - 10);

            if (showNames) {
                ctx.font = (active ? 20 : 12) + 'px sans-serif';
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = active ? 3 : 2;
                ctx.strokeText(capName, city.x + 8 - 50 * city.x / size.x, city.y - 16);
                ctx.fillText(capName, city.x + 8 - 50 * city.x / size.x, city.y - 16);
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
            const w = surface.canvas.width = window.innerWidth;
            const h = surface.canvas.height = window.innerHeight;

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

    const drawAfter = (f) => (...args) => {
        f(...args);
        return draw(shift.x, shift.y, scale);
    };

    const board = {
        update: () => { redraw = true; draw(); },
        size: (s) => { Object.assign(size, s); return board; },
        surface: (s) => { surface = s; return board; },
        cities: (c) => { cities = c; return board; },
        paths: (p) => { paths = p; return board; },
        showNames: drawAfter((b) => showNames = b),
        highlight: drawAfter((p) => {
            selected = null;
            click = p;
            const w = surface.canvas.width = window.innerWidth;
            const h = surface.canvas.height = window.innerHeight;
            click.x -= scale * (shift.x + (w - size.x) / 2);
            click.y -= scale * (shift.y + (h - size.y) / 2);
        }),
        selected: () => selected,
        move: drawAfter((dx, dy) => {
            shift.x += dx * scale;
            shift.y += dy * scale;
            shift.x = Math.max(-size.x / 2, Math.min(size.x / 2, shift.x));
            shift.y = Math.max(-size.y / 2, Math.min(size.y / 2, shift.y));
            redraw = false;
        }),
        zoom: drawAfter((dz) => {
            scale *= dz;
            redraw = false;
        })
    };

    return board;
})();
