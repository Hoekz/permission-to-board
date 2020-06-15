function arc(A, B, n, isDbl) {
    // use straight lines for now, offset slightly based off multi-path
    return line(A, B, n, isDbl);
}

function line(A, B, n, isDbl) {
    const abx = B.x - A.x;
    const aby = B.y - A.y;
    const ox = isDbl ? Math.sign(aby) * 6 : 0;
    const oy = isDbl ? Math.sign(abx) * -6 : 0;

    const points = [];

    for (let i = 1; i <= n; i++) {
        points.push({
            x: A.x + abx * i / (n + 1) + ox,
            y: A.y + aby * i / (n + 1) + oy
        });
    }

    return points;
}

function onPath(pts, x, y) {
    return pts.some((pt) => 200 > (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y))
     || pts.map((pt, i) => i ? { x: (pt.x+pts[i-1].x)/2, y: (pt.y+pts[i-1].y)/2 } : pt)
        .some((pt) => 200 > (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y));
}
