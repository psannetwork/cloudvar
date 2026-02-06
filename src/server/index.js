const { WebSocketServer } = require('ws');
const config = require('../config');
const SyncEngine = require('./sync-engine');
const utils = require('../utils');

class CloudVarServer {
    constructor() {
        this.wss = new WebSocketServer({ port: config.port });
        this.engine = new SyncEngine(this.wss);
        this.wss.on('connection', (ws) => this.handleConnection(ws));
        utils.log(`CloudVar Server running on port ${config.port}`);
    }

    handleConnection(ws) {
        const clientId = utils.generateId();
        let currentRoom = null;

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);

                if (msg.type === 'join') {
                    currentRoom = this.engine.handleJoin(ws, clientId, msg);
                    return;
                }

                if (!currentRoom) return;

                if (msg.type === 'set') {
                    currentRoom.setVariable(msg.key, msg.value);
                    const updateMsg = { type: 'update', key: msg.key, value: msg.value, sender: clientId, target: msg.target };
                    this.engine.broadcast(currentRoom, updateMsg, ws, clientId);
                    this.engine.publish(currentRoom.id, updateMsg, clientId);
                    return;
                }

                if (msg.type === 'signal') {
                    const target = currentRoom.clients.get(msg.to);
                    if (target) target.send(JSON.stringify({ type: 'signal', from: clientId, data: msg.data }));
                }
            } catch (e) {}
        });

        ws.on('close', () => {
            if (currentRoom) {
                currentRoom.removeClient(clientId);
                this.engine.broadcast(currentRoom, { type: 'client_leave', id: clientId }, null);
            }
        });
    }
}

new CloudVarServer();
