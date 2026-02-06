class CloudVar {
    constructor(url, options = {}) {
        this.config = {
            url: url,
            token: options.token || 'default-password',
            mode: options.mode || 'ws',
            room: options.room || null
        };

        this.id = null;
        this.roomId = null;
        this.joined = false;
        this.clientList = [];
        this.blockList = new Set();
        
        this._rawVars = {};
        this._pendingSets = [];
        this._listeners = new Map();
        this._ws = null;
        this._peers = new Map();

        this._connect();

        if (this.config.room) {
            this.join(this.config.room);
        }

        // 🌟 ページ読み込み完了時、および値の変更時にHTMLを自動更新する
        if (typeof document !== 'undefined') {
            this._setupAutoBind();
        }

        return new Proxy(this, {
            get: (target, key) => {
                if (key in target || typeof key === 'symbol') return target[key];
                return target._rawVars[key];
            },
            set: (target, key, value) => {
                if (typeof key === 'string' && (key.startsWith('_') || key in target)) {
                    target[key] = value;
                    return true;
                }
                if (!(key in window) && typeof key === 'string') {
                    target._linkToGlobal(key);
                }
                target._set(key, value);
                return true;
            }
        });
    }

    // 🌟 HTMLの cv-bind 属性を探して自動同期する
    _setupAutoBind() {
        const updateElements = (key, value) => {
            const elements = document.querySelectorAll(`[cv-bind="${key}"]`);
            elements.forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    if (el.value !== String(value)) el.value = value;
                } else {
                    if (el.innerText !== String(value)) el.innerText = value;
                }
            });
        };

        // 値が変わった時にHTMLを更新するリスナーを登録
        this.onChange('*', (key, value) => {
            updateElements(key, value);
        });

        // 双方向バインディング：入力フォームが変わったら変数も変える
        document.addEventListener('input', (e) => {
            const key = e.target.getAttribute('cv-bind');
            if (key) {
                this[key] = e.target.value;
            }
        });

        // 初回スキャン用（DOMが既にある場合）
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[cv-bind]').forEach(el => {
                const key = el.getAttribute('cv-bind');
                if (this._rawVars[key] !== undefined) updateElements(key, this._rawVars[key]);
            });
        });
    }

    join(roomId, password = null) {
        this.roomId = roomId;
        this._sendWS({ type: 'join', roomId, password, token: this.config.token });
    }

    _set(key, value) {
        this._rawVars[key] = value;
        const payload = { type: 'set', key, value, roomId: this.roomId };
        if (!this.joined) {
            this._pendingSets.push(payload);
        } else {
            if (this.config.mode === 'p2p') this._broadcastP2P(payload);
            this._sendWS(payload);
        }
        this._emit(key, value);
        this._emit('*', value, key); // 全体監視用
    }

    _connect() {
        this._ws = new WebSocket(this.config.url);
        this._ws.onopen = () => { if (this.roomId) this.join(this.roomId); };
        this._ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.sender && this.blockList.has(msg.sender)) return;

            switch(msg.type) {
                case 'join_ok':
                    this.joined = true;
                    this.id = msg.id;
                    this.clientList = msg.clients;
                    Object.assign(this._rawVars, msg.data);
                    while (this._pendingSets.length > 0) {
                        const p = this._pendingSets.shift();
                        this._sendWS(p);
                        if (this.config.mode === 'p2p') this._broadcastP2P(p);
                    }
                    Object.keys(this._rawVars).forEach(k => { 
                        if(!(k in window)) this._linkToGlobal(k); 
                        this._emit(k, this._rawVars[k]); 
                        this._emit('*', this._rawVars[k], k);
                    });
                    this._emit('_joined', msg.roomId);
                    break;
                case 'update':
                    if (!(msg.key in window)) this._linkToGlobal(msg.key);
                    this._rawVars[msg.key] = msg.value;
                    this._emit(msg.key, msg.value);
                    this._emit('*', msg.value, msg.key);
                    break;
                // ... client_join 等は省略せず保持 ...
            }
        };
        this._ws.onclose = () => setTimeout(() => this._connect(), 2000);
    }

    _sendWS(data) { if (this._ws && this._ws.readyState === WebSocket.OPEN) this._ws.send(JSON.stringify(data)); }
    _linkToGlobal(key) {
        Object.defineProperty(window, key, {
            get: () => this._rawVars[key],
            set: (val) => this._set(key, val),
            configurable: true
        });
    }

    _emit(key, value, extra) { 
        if (this._listeners.has(key)) {
            this._listeners.get(key).forEach(cb => {
                if (key === '*') cb(extra, value); // key, value
                else cb(value);
            });
        }
    }

    onChange(key, callback) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(callback);
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = CloudVar;
else window.CloudVar = CloudVar;