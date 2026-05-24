var http = require('http'), fs = require('fs'), path = require('path');
var WebSocket = require('ws');
var root = __dirname;
var MIME = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.map':'application/json' };

// === Static file server ===
var server = http.createServer(function(req, r) {
    var u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    var f = u === '/' ? '/anonymous-chat.html' : u;
    if (!f.startsWith('/')) f = '/' + f;
    var p = path.resolve(path.join(root, f));
    if (!p.startsWith(root)) { r.writeHead(403); r.end('Forbidden'); return; }
    fs.readFile(p, function(e, d) {
        if (e) { r.writeHead(404); r.end('Not found'); return; }
        var ct = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
        r.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache' });
        r.end(d);
    });
});

// === WebSocket relay server ===
var wss = new WebSocket.Server({ server: server });
// rooms: { roomName -> { ws_id -> { ws, nick } } }
var rooms = {};

function broadcast(room, msg, excludeWs) {
    var members = rooms[room];
    if (!members) return;
    Object.keys(members).forEach(function(id) {
        var m = members[id];
        if (m.ws !== excludeWs && m.ws.readyState === WebSocket.OPEN) {
            try { m.ws.send(msg); } catch(e) {}
        }
    });
}

wss.on('connection', function(ws) {
    var myRoom = null, myId = null, myNick = '';
    ws.on('message', function(raw) {
        var data;
        try { data = JSON.parse(raw.toString()); } catch(e) { return; }
        if (!data || !data.t) return;

        if (data.t === 'j') {
            // Join room
            var r = (data.r || '').trim().toLowerCase();
            if (!r) { try { ws.close(4000, 'no room'); } catch(e) {} return; }
            myRoom = r;
            myId = Date.now().toString(36) + Math.random().toString(36).substr(2,4);
            myNick = (data.n || '').substring(0,20);
            if (!rooms[r]) rooms[r] = {};

            // Broadcast join to existing members
            broadcast(r, JSON.stringify({ t: 'j', n: myNick }), null);

            // Register self
            rooms[r][myId] = { ws: ws, nick: myNick };

            // Notify self of existing peers already in the room
            Object.keys(rooms[r]).forEach(function(id) {
                if (id !== myId) {
                    var m = rooms[r][id];
                    if (m.ws.readyState === WebSocket.OPEN) {
                        try { ws.send(JSON.stringify({ t: 'j', n: m.nick })); } catch(e) {}
                    }
                }
            });

            console.log('[relay] +join room=' + r + ' id=' + myId + ' nick=' + myNick + ' total=' + Object.keys(rooms[r]).length);

        } else if (data.t === 'm' && myRoom) {
            // Relay message
            var text = (data.x || '').substring(0, 4000);
            broadcast(myRoom, JSON.stringify({ t: 'm', n: myNick, x: text }), ws);

        } else if (data.t === 'l' && myRoom) {
            leaveRoom();
        }
    });

    function leaveRoom() {
        if (!myRoom || !myId || !rooms[myRoom]) return;
        delete rooms[myRoom][myId];
        var count = Object.keys(rooms[myRoom]).length;
        console.log('[relay] -left room=' + myRoom + ' id=' + myId + ' remaining=' + count);
        if (count === 0) {
            delete rooms[myRoom];
        } else {
            broadcast(myRoom, JSON.stringify({ t: 'l', n: myNick }), null);
        }
        myRoom = null; myId = null;
    }

    ws.on('close', leaveRoom);
    ws.on('error', leaveRoom);
});

server.listen(3000, function() {
    console.log('http://localhost:3000  (static + relay)');
});
