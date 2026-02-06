const { WebSocketServer, WebSocket } = require('ws');
const config = require('./config');

class CloudVarServer {
    constructor() {
        this.wss = new WebSocketServer({ port: config.port });
        this.rooms = new Map(); // roomId -> { variables: Map, clients: Map<id, ws>, password: string|null }
        this.setupRedis();
        this.wss.on('connection', (ws) => this.handleConnection(ws));
        console.log(`CloudVar Server running on port ${config.port}`);
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
        } catch (e) {}
    }

    handleConnection(ws) {
        const id = Math.random().toString(36).substring(2, 9);
        let currentRoomId = null;

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);

                // --- ルーム参加/作成 ---
                if (msg.type === 'join') {
                    const room = this.getOrCreateRoom(msg.roomId, msg.password);
                    
                    // パスワードチェック
                    if (room.password && room.password !== msg.password) {
                        return ws.send(JSON.stringify({ type: 'error', message: 'Wrong room password' }));
                    }

                    currentRoomId = msg.roomId;
                    room.clients.set(id, ws);
                    
                    ws.send(JSON.stringify({
                        type: 'join_ok',
                        id: id,
                        roomId: currentRoomId,
                        data: Object.fromEntries(room.variables),
                        clients: Array.from(room.clients.keys())
                    }));

                    this.broadcast(room, { type: 'client_join', id }, ws);
                    return;
                }

                if (!currentRoomId) return;
                const room = this.rooms.get(currentRoomId);

                // --- P2Pシグナリング ---
                if (msg.type === 'signal') {
                    const target = room.clients.get(msg.to);
                    if (target) target.send(JSON.stringify({ type: 'signal', from: id, data: msg.data }));
                    return;
                }

                // --- 変数更新 ---
                if (msg.type === 'set') {
                    room.variables.set(msg.key, msg.value);
                    const updateMsg = { type: 'update', key: msg.key, value: msg.value, sender: id, target: msg.target };
                    this.broadcast(room, updateMsg, ws, id);
                    if (this.redisPub) {
                        this.redisPub.publish('cloudvar_sync', JSON.stringify({ roomId: currentRoomId, msg: updateMsg, senderId: id }));
                    }
                }
            } catch (e) {}
        });

        ws.on('close', () => {
            if (currentRoomId) {
                const room = this.rooms.get(currentRoomId);
                room.clients.delete(id);
                this.broadcast(room, { type: 'client_leave', id }, null);
                if (room.clients.size === 0) this.rooms.delete(currentRoomId);
            }
        });
    }

    getOrCreateRoom(roomId, password = null) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, { variables: new Map(), clients: new Map(), password });
        }
        return this.rooms.get(roomId);
    }

    broadcast(room, message, senderWs, senderId) {
        const data = JSON.stringify(message);
        room.clients.forEach((clientWs, clientId) => {
            if (clientWs === senderWs) return;
            if (message.target && message.target !== clientId) return;
            if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data);
        });
    }
}

new CloudVarServer();