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
            console.log(`Room [${this.id}] deleted due to inactivity.`);
            this.onDelete(this.id);
        }, config.roomExpirationMs);
    }

    setVariable(key, value) {
        this.variables.set(key, value);
    }

    getVariables() {
        return Object.fromEntries(this.variables);
    }
}

module.exports = Room;
