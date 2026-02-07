const http = require('http');
const WebSocket = require('ws');
const SyncEngine = require('./sync-engine');
const RoomManager = require('./room');
const utils = require('../utils');

class CloudVarServer {
    constructor(options = {}) {
        this.port = options.port || 5032;
        this.server = options.server || http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });
        this.rooms = new RoomManager();
        this.engine = new SyncEngine(this.rooms);

        this.setup();
    }

    setup() {
        this.wss.on('connection', (ws) => {
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data);
                    this.engine.handle(ws, msg);
                } catch (e) {
                    console.error('[ERR] Invalid JSON', e);
                }
            });

            ws.on('close', () => {
                this.rooms.leaveAll(ws);
            });
        });
    }

    start() {
        if (this.server.listening) return;
        this.server.listen(this.port, () => {
            console.log(`[INFO] CloudVar Server running on port ${this.port}`);
        });
    }
}

// 直接実行された場合の起動処理
if (require.main === module) {
    const server = new CloudVarServer();
    server.start();
}

module.exports = CloudVarServer;