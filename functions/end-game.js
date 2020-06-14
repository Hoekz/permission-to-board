
function subGraphs(connections) {
    const graphs = [];

    connections.forEach(connection => {
        const inGraphs = graphs.filter(graph => graph.nodes.includes(connection.start) || graph.nodes.includes(connection.end));

        if (inGraphs.length === 2) {
            const newGraph = {
                nodes: [...new Set([...inGraphs[0].nodes, ...inGraphs[1].nodes, connection.start, connection.end])],
                connections: [...inGraphs[0].connections, ...inGraphs[1].connections, connection],
            };

            graphs.splice(graphs.indexOf(inGraphs[0]), 1);
            graphs.splice(graphs.indexOf(inGraphs[1]), 1);
            graphs.push(newGraph);
        }

        if (inGraphs.length === 1) {
            inGraphs[0].nodes = [...new Set([...inGraphs[0].nodes, connection.start, connection.end])];
            inGraphs[0].connections.push(connection);
        }

        if (inGraphs.length === 0) {
            graphs.push({ nodes: [connection.start, connection.end], connections: [connection] });
        }
    });

    return graphs;
}

function playerGraphs(game) {
    return game.board.connections.reduce((players, connection) => {
        if (!connection.occupant) {
            return players;
        }

        if (!(connection.occupant in players)) {
            players[connection.occupant] = [];
        }

        players[connection.occupant].push(connection);

        return players;
    }, {});
}

function playerSubGraphs(game) {
    return Object.entries(playerGraphs(game)).reduce((players, [player, connections]) => {
        players[player] = subGraphs(connections);
        return players;
    }, {});
}

function routeMet(graphs, route) {
    return graphs.some(graph => graph.nodes.includes(route.start) && graph.nodes.includes(route.end));
}

function simplifyGraph(nodeMap, connections) {
    const nodes = Object.keys(nodeMap);

    // get all nodes with 2 connections
    const middleNodes = nodes.filter(node => nodeMap[node].length === 2);

    const newConnections = middleNodes.reduce((connections, node) => {
        const [a, b] = connections.filter(conn => conn.start === node || conn.end === node);

        if (!a || !b) {
            return connections;
        }

        const [start, end] = [a.start, a.end, b.start, b.end].filter(n => n !== node);

        const conn = { start, end, length: a.length + b.length };

        return [conn, ...connections.filter(conn => conn !== a && conn !== b)];
    }, connections.slice());

    const newNodeMap = connections.reduce((nodes, conn) => {
        nodes[conn.start] = [...(nodes[conn.start] || []), conn.end];
        nodes[conn.end] = [...(nodes[conn.end] || []), conn.start];

        return nodes;
    }, {});

    return { nodeMap: newNodeMap, connections: newConnections };
}

function furthest(node, connections) {
    return connections.filter(conn => conn.start === node || conn.end === node)
        .reduce((max, conn) => {
            const other = conn.start === node ? conn.end : conn.start;
            const dist = conn.length + furthest(other, connections.filter(c => c === conn));

            return max > dist ? max : dist;
        }, 0);
}

function maximize(nodeMap, connections) {
    const simple = simplifyGraph(nodeMap, connections);

    if (simple.connections.length < 3) {
        return simple.connections.reduce((total, conn) => total + conn.length, 0);
    }

    return Math.max(...Object.keys(simple.nodeMap).map(node => furthest(node, simple.connections)));
}

function maxRouteLength({ connections }) {
    const nodeList = [...new Set([
        ...connections.map(conn => conn.start),
        ...connections.map(conn => conn.end),
    ])];

    const nodeMap = nodeList.reduce((map, node) => {
        map[node] = [
            ...connections.filter(conn => conn.start === node).map(conn => conn.end),
            ...connections.filter(conn => conn.end === node).map(conn => conn.start),
        ];
        return map;
    });

    return maximize(nodeMap, connections);
}

function longestRoute(playerGraphs) {
    const maxLengths = Object.entries(playerGraphs).reduce((lengths, [player, subGraphs]) => {
        lengths[player] = Math.max(...subGraphs.map(maxRouteLength));
        return lengths;
    }, {});

    const max = Math.max(...Object.entries(maxLengths));

    return Object.keys(maxLengths).filter(player => maxLengths[player] === max);
}

function endGame(game) {
    game.ref.child('started').set('finished');

    const allSubGraphs = playerSubGraphs(game);

    for (let player in game.players) {
        const diff = game.players[player].routes.reduce((diff, route) =>
            diff + (routeMet(allSubGraphs[player], route) ? route.worth : -route.worth)
        , 0);

        game.ref.child('players').child(player).child('routeBonus').set(diff);
    }

    longestRoute(allSubGraphs).forEach(player => {
        game.ref.child('players').child(player).child('longestTrainBonus').set(10);
    });
}

module.exports = { endGame };
