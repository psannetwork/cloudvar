const { WebSocket } = require('ws');
const config = require('../config');
const Room = require('./room');

class SyncEngine {
    constructor(wss) {
        this.wss = wss;
        this.rooms = new Map();
        this.setupRedis();
    }

    async setupRedis() {
        if (!config.redis) return;
        try {
            const { createClient } = require('redis');
            this.redisPub = createClient({ url: config.redis });
            this.redisSub = this.redisPub.duplicate();
            await Promise.all([this.redisPub.connect(), this.redisSub.connect()]);
            this.redisSub.subscribe('cloudvar_sync', (message) => {
                const { roomId, msg, senderId } = JSON.parse(message);
                const room = this.rooms.get(roomId);
                if (room) this.broadcast(room, msg, null, senderId);
            });
        } catch (e) { console.error("Redis Error:", e); }
    }

    handleJoin(ws, clientId, msg) {
        let room = this.rooms.get(msg.roomId);
        
        if (!room) {
            room = new Room(msg.roomId, msg.password, (id) => this.rooms.delete(id));
            this.rooms.set(msg.roomId, room);
        }

        if (room.password && room.password !== msg.password) {
            return ws.send(JSON.stringify({ type: 'error', message: 'Wrong password' }));
        }

        room.addClient(clientId, ws);
        
        ws.send(JSON.stringify({
            type: 'join_ok',
            id: clientId,
            roomId: msg.roomId,
            data: room.getVariables(),
            clients: Array.from(room.clients.keys())
        }));

        this.broadcast(room, { type: 'client_join', id: clientId }, ws);
        return room;
    }

    broadcast(room, message, senderWs, senderId) {
        const data = JSON.stringify(message);
        room.clients.forEach((clientWs, clientId) => {
            if (clientWs === senderWs) return;
            if (message.target && message.target !== clientId) return;
            if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data);
        });
    }

    publish(roomId, msg, senderId) {
        if (this.redisPub) {
            this.redisPub.publish('cloudvar_sync', JSON.stringify({ roomId, msg, senderId }));
        }
    }
}

module.exports = SyncEngine;
