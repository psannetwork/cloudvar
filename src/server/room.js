const config = require('../config');

class Room {
    constructor(id, password = null, onDelete) {
        this.id = id;
        this.password = password;
        this.variables = new Map();
        this.clients = new Map(); // id -> ws
        this.expiryTimer = null;
        this.onDelete = onDelete;
    }

    addClient(clientId, ws) {
        if (this.expiryTimer) {
            clearTimeout(this.expiryTimer);
            this.expiryTimer = null;
        }
        this.clients.set(clientId, ws);
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        if (this.clients.size === 0) {
            this.startExpiryTimer();
        }
    }

    startExpiryTimer() {
        this.expiryTimer = setTimeout(() => {
            console.log(`[INFO] Room [${this.id}] deleted due to inactivity.`);
            this.onDelete(this.id);
        }, config.roomExpirationMs || 300000);
    }

    setVariable(key, value) {
        this.variables.set(key, value);
    }

    getVariables() {
        return Object.fromEntries(this.variables);
    }
}

class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    get(id) {
        return this.rooms.get(id);
    }

    getOrCreate(id, password = null) {
        if (!this.rooms.has(id)) {
            const room = new Room(id, password, (id) => this.rooms.delete(id));
            this.rooms.set(id, room);
        }
        return this.rooms.get(id);
    }

    leaveAll(clientId) {
        this.rooms.forEach(room => {
            if (room.clients.has(clientId)) {
                room.removeClient(clientId);
                // 他のクライアントへ退室を通知
                const data = JSON.stringify({ type: 'client_leave', id: clientId });
                room.clients.forEach(ws => {
                    if (ws.readyState === 1) ws.send(data);
                });
            }
        });
    }
}

module.exports = RoomManager;