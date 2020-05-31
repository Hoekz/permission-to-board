var db = require("firebase-admin").database();
const { Err, rand } = require('./utility');
var { createPlayer, colors } = require('./join-game');

function createGameKey() {
    var charset = [
        'alpha', 'bravo', 'charlie', 'delta', 'echo',
        'foxtrot', 'golf', 'hotel', 'india', 'juliett',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];

    return [0,0,0,0].map(() => charset[rand(charset.length)]).join('-');
}

/* TODO: Procedural generation of maps
function createCities(count) {
    var bases = [
        'Arnold', 'Baker', 'Coal', 'Daven', 'Ellis', 'Farm', 'Green',
        'Hart', 'Irving', 'James', 'King', 'Lake', 'Munger', 'Nelson',
        'Oak', 'Poole', 'Queen', 'River', 'Spring'
    ].sort(() => Math.random() - 0.5);

    var seed = randInt(19);
    var shift = randInt(17) + 1;

    var cities = [];

    while (count--) {
        var city = bases[seed];

        switch(randInt(15)) {
            case 0:  city = 'Saint ' + city; break;
            case 1:  city = 'Fort ' + city; break;
            case 2:  city = 'New ' + city; break;
            case 3:  city = 'Old ' + city; break;
            case 4:  city = 'Santa ' + city; break;
            case 5:  city = 'North ' + city; break;
            case 6:  city = 'South ' + city; break;
            case 7:  city = 'East ' + city; break;
            case 8:  city = 'West ' + city; break;
            default: city = city;
        }

        switch(randInt(10)) {
            case 0: city += ' City'; break;
            case 1: city += 'ville'; break;
            case 2: city += 'port'; break;
            case 3: city += 'town'; break;
            case 4: city += 'field'; break;
            default: city = city;
        }

        if (city.length < 6 || cities.indexOf(city) > -1) {
            count++;
            continue;
        }

        cities.push(city);
        seed = (seed + shift) % 19;
    }

    return cities;
}

function createMap(count) {
    // min dist == 1
    // max dist == 6
    // 2 allowed if not same color or both grey
    // every point must have at least 2 connections
    // each color gets 27 units and 7 paths
    // length 1 must be grey
    // only 3 grey can be 4 or greater
    // there are at least 40 grey paths
    // grey pairs = 10, 2 or 1 length
    // 4 length 2 color pairs
    // 3 length 3 color pairs
    // 2 length 4 color pairs
    // 2 length 5 color pairs
    // no length 6 pairs
    // only 1 point with 2 connections (rare)
    // 4 with same color twice, have 7+ connections


    // choose a set of lengths for each color
    var a = [2, 2, 3, 4, 5, 5, 6];// t = 27
    var b = [2, 3, 3, 4, 4, 5, 6];// t = 27
}
*/

function originalMap() {
    var size = { x: 950, y: 600 };
    var cities = {
        'vancouver': {x: 72, y: 64},
        'calgary': {x: 204, y: 48},
        'winnipeg': {x: 428, y: 56},
        'sault st marie': {x: 668, y: 108},
        'montreal': {x: 860, y: 40},
        'boston': {x: 930, y: 100},
        'seattle': {x: 68, y: 118},
        'helena': {x: 304, y: 180},
        'duluth': {x: 540, y: 172},
        'toronto': {x: 776, y: 128},
        'new york': {x: 878, y: 176},
        'portland': {x: 48, y: 170},
        'omaha': {x: 510, y: 256},
        'chicago': {x: 664, y: 236},
        'pittsburgh': {x: 792, y: 220},
        'salt lake city': {x: 232, y: 300},
        'denver': {x: 364, y: 332},
        'kansas city': {x: 532, y: 316},
        'saint louis': {x: 620, y: 320},
        'washington': {x: 888, y: 268},
        'san fransisco': {x: 32, y: 364},
        'las vegas': {x: 176, y: 412},
        'santa fe': {x: 356, y: 424},
        'oklahoma city': {x: 512, y: 404},
        'little rock': {x: 600, y: 408},
        'nashville': {x: 712, y: 356},
        'atlanta': {x: 760, y: 392},
        'raleigh': {x: 828, y:332},
        'charleston': {x: 856, y: 400},
        'los angeles': {x: 112, y: 472},
        'phoenix': {x: 232, y: 476},
        'el paso': {x: 348, y: 512},
        'dallas': {x: 532, y: 492},
        'houston': {x: 572, y: 532},
        'new orleans': {x: 664, y: 520},
        'miami': {x: 886, y: 556}
    };
    var connections = [
        {start: 'vancouver', end: 'seattle', color: 'any', length: 1},
        {start: 'seattle', end: 'vancouver', color: 'any', length: 1},
        {start: 'seattle', end: 'portland', color: 'any', length: 1},
        {start: 'portland', end: 'seattle', color: 'any', length: 1},
        {start: 'dallas', end: 'houston', color: 'any', length: 1},
        {start: 'houston', end: 'dallas', color: 'any', length: 1},
        {start: 'omaha', end: 'kansas city', color: 'any', length: 1},
        {start: 'kansas city', end: 'omaha', color: 'any', length: 1},
        {start: 'nashville', end: 'atlanta', color: 'any', length: 1},
        {start: 'sault st marie', end: 'toronto', color: 'any', length: 2},
        {start: 'montreal', end: 'boston', color: 'any', length: 2},
        {start: 'boston', end: 'montreal', color: 'any', length: 2},
        {start: 'pittsburgh', end: 'toronto', color: 'any', length: 2},
        {start: 'pittsburgh', end: 'washington', color: 'any', length: 2},
        {start: 'pittsburgh', end: 'raleigh', color: 'any', length: 2},
        {start: 'raleigh', end: 'washington', color: 'any', length: 2},
        {start: 'washington', end: 'raleigh', color: 'any', length: 2},
        {start: 'raleigh', end: 'charleston', color: 'any', length: 2},
        {start: 'raleigh', end: 'atlanta', color: 'any', length: 2},
        {start: 'atlanta', end: 'raleigh', color: 'any', length: 2},
        {start: 'atlanta', end: 'charleston', color: 'any', length: 2},
        {start: 'saint louis', end: 'nashville', color: 'any', length: 2},
        {start: 'saint louis', end: 'little rock', color: 'any', length: 2},
        {start: 'little rock', end: 'dallas', color: 'any', length: 2},
        {start: 'little rock', end: 'oklahoma city', color: 'any', length: 2},
        {start: 'oklahoma city', end: 'dallas', color: 'any', length: 2},
        {start: 'dallas', end: 'oklahoma city', color: 'any', length: 2},
        {start: 'houston', end: 'new orleans', color: 'any', length: 2},
        {start: 'oklahoma city', end: 'kansas city', color: 'any', length: 2},
        {start: 'kansas city', end: 'oklahoma city', color: 'any', length: 2},
        {start: 'duluth', end: 'omaha', color: 'any', length: 2},
        {start: 'omaha', end: 'duluth', color: 'any', length: 2},
        {start: 'duluth', end: 'omaha', color: 'any', length: 2},
        {start: 'denver', end: 'santa fe', color: 'any', length: 2},
        {start: 'santa fe', end: 'el paso', color: 'any', length: 2},
        {start: 'las vegas', end: 'los angeles', color: 'any', length: 2},
        {start: 'vancouver', end: 'calgary', color: 'any', length: 3},
        {start: 'duluth', end: 'sault st marie', color: 'any', length: 3},
        {start: 'toronto', end: 'montreal', color: 'any', length: 3},
        {start: 'los angeles', end: 'phoenix', color: 'any', length: 3},
        {start: 'phoenix', end: 'santa fe', color: 'any', length: 3},
        {start: 'phoenix', end: 'el paso', color: 'any', length: 3},
        {start: 'seattle', end: 'calgary', color: 'any', length: 4},
        {start: 'helena', end: 'calgary', color: 'any', length: 4},
        {start: 'winnipeg', end: 'sault st marie', color: 'any', length: 6},//all grey
        {start: 'new york', end: 'boston', color: 'red', length: 2},
        {start: 'duluth', end: 'chicago', color: 'red', length: 3},
        {start: 'denver', end: 'salt lake city', color: 'red', length: 3},
        {start: 'denver', end: 'oklahoma city', color: 'red', length: 4},
        {start: 'dallas', end: 'el paso', color: 'red', length: 4},
        {start: 'helena', end: 'omaha', color: 'red', length: 5},
        {start: 'miami', end: 'new orleans', color: 'red', length: 6},//all red
        {start: 'washington', end: 'new york', color: 'orange', length: 2},
        {start: 'chicago', end: 'pittsburgh', color: 'orange', length: 3},
        {start: 'las vegas', end: 'salt lake city', color: 'orange', length: 3},
        {start: 'denver', end: 'kansas city', color: 'orange', length: 4},
        {start: 'atlanta', end: 'new orleans', color: 'orange', length: 4},
        {start: 'san fransisco', end: 'salt lake city', color: 'orange', length: 5},
        {start: 'helena', end: 'duluth', color: 'orange', length: 6},//all orange
        {start: 'boston', end: 'new york', color: 'yellow', length: 2},
        {start: 'salt lake city', end: 'denver', color: 'yellow', length: 3},
        {start: 'san fransisco', end: 'los angeles', color: 'yellow', length: 3},
        {start: 'nashville', end: 'pittsburgh', color: 'yellow', length: 4},
        {start: 'new orleans', end: 'atlanta', color: 'yellow', length: 4},
        {start: 'el paso', end: 'oklahoma city', color: 'yellow', length: 5},
        {start: 'seattle', end: 'helena', color: 'yellow', length: 6},//all yellow
        {start: 'pittsburgh', end: 'new york', color: 'green', length: 2},
        {start: 'chicago', end: 'saint louis', color: 'green', length: 2},
        {start: 'little rock', end: 'new orleans', color: 'green', length: 3},
        {start: 'denver', end: 'helena', color: 'green', length: 4},
        {start: 'portland', end: 'san fransisco', color: 'green', length: 5},
        {start: 'saint louis', end: 'pittsburgh', color: 'green', length: 5},
        {start: 'houston', end: 'el paso', color: 'green', length: 6},//all green
        {start: 'saint louis', end: 'kansas city', color: 'blue', length: 2},
        {start: 'montreal', end: 'new york', color: 'blue', length: 3},
        {start: 'santa fe', end: 'oklahoma city', color: 'blue', length: 3},
        {start: 'helena', end: 'winnipeg', color: 'blue', length: 4},
        {start: 'omaha', end: 'chicago', color: 'blue', length: 4},
        {start: 'miami', end: 'atlanta', color: 'blue', length: 5},
        {start: 'portland', end: 'salt lake city', color: 'blue', length: 6},//all blue
        {start: 'kansas city', end: 'saint louis', color: 'violet', length: 2},
        {start: 'los angeles', end: 'san fransisco', color: 'violet', length: 3},
        {start: 'helena', end: 'salt lake city', color: 'violet', length: 3},
        {start: 'denver', end: 'omaha', color: 'violet', length: 4},
        {start: 'miami', end: 'charleston', color: 'violet', length: 4},
        {start: 'san fransisco', end: 'portland', color: 'violet', length: 5},
        {start: 'duluth', end: 'toronto', color: 'violet', length: 6},//all violet
        {start: 'new york', end: 'washington', color: 'black', length: 2},
        {start: 'pittsburgh', end: 'chicago', color: 'black', length: 3},
        {start: 'nashville', end: 'raleigh', color: 'black', length: 3},
        {start: 'kansas city', end: 'denver', color: 'black', length: 4},
        {start: 'duluth', end: 'winnipeg', color: 'black', length: 4},
        {start: 'montreal', end: 'sault st marie', color: 'black', length: 5},
        {start: 'los angeles', end: 'el paso', color: 'black', length: 6},//all black
        {start: 'new york', end: 'pittsburgh', color: 'white', length: 2},
        {start: 'saint louis', end: 'chicago', color: 'white', length: 2},
        {start: 'nashville', end: 'little rock', color: 'white', length: 3},
        {start: 'chicago', end: 'toronto', color: 'white', length: 4},
        {start: 'phoenix', end: 'denver', color: 'white', length: 5},
        {start: 'salt lake city', end: 'san fransisco', color: 'white', length: 5},
        {start: 'calgary', end: 'winnipeg', color: 'white', length: 6},//all white
    ];
    return { points: cities, connections, size };
}

function originalRoutes() {
    const routes = [
        {start: 'denver', end: 'el paso', worth: 4},
        {start: 'kansas city', end: 'houston', worth: 5},
        {start: 'new york', end: 'atlanta', worth: 6},
        {start: 'calgary', end: 'salt lake city', worth: 7},
        {start: 'chicago', end: 'new orleans', worth: 7},
        {start: 'duluth', end: 'houston', worth: 8},
        {start: 'helena', end: 'los angeles', worth: 8},
        {start: 'sault st marie', end: 'nashville', worth: 8},
        {start: 'sault st marie', end: 'oklahoma city', worth: 9},
        {start: 'chicago', end: 'santa fe', worth: 9},
        {start: 'montreal', end: 'atlanta', worth: 9},
        {start: 'seattle', end: 'los angeles', worth: 9},
        {start: 'toronto', end: 'miami', worth: 10},
        {start: 'duluth', end: 'el paso', worth: 10},
        {start: 'winnipeg', end: 'little rock', worth: 11},
        {start: 'denver', end: 'pittsburgh', worth: 11},
        {start: 'boston', end: 'miami', worth: 12},
        {start: 'montreal', end: 'new orleans', worth: 13},
        {start: 'calgary', end: 'phoenix', worth: 13},
        {start: 'vancouver', end: 'santa fe', worth: 13},
        {start: 'los angeles', end: 'chicago', worth: 16},
        {start: 'san francisco', end: 'atlanta', worth: 17},
        {start: 'portland', end: 'nashville', worth: 17},
        {start: 'vancouver', end: 'montreal', worth: 20},
        {start: 'los angeles', end: 'miami', worth: 20},
        {start: 'los angeles', end: 'new york', worth: 21},
        {start: 'seattle', end: 'new york', worth: 4},
    ];

    const randomized = [];

    while (routes.length) {
        const i = rand(routes.length);
        randomized.push(routes[i]);
        routes.splice(i, 1);
    }

    return randomized;
}

function initGame(user, color) {
    return {
        board: originalMap(),
        routes: originalRoutes(),
        players: {
            [color]: createPlayer(user),
        },
        deck: {
            red: 12,
            orange: 12,
            yellow: 12,
            green: 12,
            blue: 12,
            violet: 12,
            white: 12,
            black: 12,
            locomotive: 14
        }
    };
}

function createGame(user) {
    const color = this.request.query.color;

    if (!colors.includes(color)) {
        throw new Err(`You must choose an one of ${colors}.`);
    }

    var key = createGameKey();
    db.ref(`/${key}`).set(initGame(user, color));

    this.response.end(JSON.stringify({ key }));
}

module.exports = { createGame };
