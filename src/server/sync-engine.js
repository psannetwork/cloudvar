const { WebSocket } = require('ws');
const config = require('../config');
const Room = require('./room');

class SyncEngine {
    constructor(rooms) {
        this.rooms = rooms; // RoomManagerインスタンス
        this._clientIds = new Map(); // ws -> clientId
    }

    handle(ws, msg) {
        let clientId = this._clientIds.get(ws);
        if (!clientId) {
            clientId = 'cl_' + Math.random().toString(36).substr(2, 9);
            this._clientIds.set(ws, clientId);
        }

        switch (msg.type) {
            case 'join':
                this.handleJoin(ws, clientId, msg);
                break;
            case 'set':
                this.handleSet(ws, clientId, msg);
                break;
        }
    }

    handleJoin(ws, clientId, msg) {
        const room = this.rooms.getOrCreate(msg.roomId, msg.password);

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
    }

    handleSet(ws, clientId, msg) {
        const room = this.rooms.get(msg.roomId);
        if (!room || !room.clients.has(clientId)) return;

        room.setVariable(msg.key, msg.value);
        this.broadcast(room, { type: 'update', key: msg.key, value: msg.value, sender: clientId }, ws);
    }

    broadcast(room, message, senderWs) {
        const data = JSON.stringify(message);
        room.clients.forEach((clientWs) => {
            if (clientWs === senderWs) return;
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data);
            }
        });
    }

    removeClient(ws) {
        const clientId = this._clientIds.get(ws);
        if (clientId) {
            this.rooms.leaveAll(clientId);
            this._clientIds.delete(ws);
        }
    }
}

module.exports = SyncEngine;