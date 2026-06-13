/**
 * @typedef {Object} CloudVarOptions
 * @property {string} [token] - The authentication token.
 * @property {string} [mode] - The connection mode (e.g., 'ws').
 * @property {string} [room] - The room ID to join.
 * @property {string} [name] - The name of the client.
 */

class CloudVar {
    /**
     * @param {string} [url='wss://cloudvar.psannetwork.net'] - The WebSocket URL.
     * @param {CloudVarOptions} [options={}] - Configuration options.
     * @returns {CloudVar} A proxy instance of CloudVar.
     */
    constructor(url = 'wss://cloudvar.psannetwork.net', options = {}) {
        this.config = { url, token: options.token || 'default', mode: options.mode || 'ws', room: options.room || null };
        this.name = options.name || null;
        this.id = null;
        this.roomId = this.config.room;
        this.joined = false;
        this.clientList = [];
        this.blockList = new Set();
        
        this._rawVars = {};
        this._localVars = new Set();
        this._pendingSets = new Map();
        this._listeners = new Map();

        // 🌟 1. プロキシを先に作成（サブモジュールがプロキシ経由でアクセスできるように）
        this._proxy = new Proxy(this, {
            get: (target, key) => target._get(key),
            set: (target, key, value) => {
                if (typeof key === 'string' && key in target && !key.startsWith('_')) {
                    target[key] = value; return true;
                }
                if (typeof key === 'string' && !this.name) target._linkToGlobal(key);
                target._set(key, value);
                return true;
            }
        });

        // 🌟 2. サブモジュールにはプロキシを渡す
        this._network = new CloudVarNetwork(this._proxy);
        this._binding = new CloudVarBinding(this._proxy);

        this._network.connect();
        
        // 🌟 3. 即座にスキャンしてリンク（既にパース済みのDOMを対象に）
        if (typeof document !== 'undefined') {
            this._scanAndLink();
            window.addEventListener('DOMContentLoaded', () => this._scanAndLink());
        }

        return this._proxy;
    }

    // 🌟 値取得の一元化（プロキシとグローバル変数の両方で使用）
    _get(key) {
        if (key === 'BR') return '\n';
        if (key === 'TIME') return Date.now();
        if (key === 'RAND') return Math.random();
        if (key === 'ID') return this.id || 'connecting...';
        if (key === 'ROOM') return this.roomId || '';
        if (key === 'COUNT') return this.clientList.length;
        if (key === 'TRUE') return true;
        if (key === 'FALSE') return false;
        if (key === 'NULL') return null;
        if (key === 'varList') return this.varList;

        if (key in this || typeof key === 'symbol') return this[key];
        return this._rawVars[key] !== undefined ? this._rawVars[key] : "";
    }

    /**
     * @returns {string[]} List of synchronized variables.
     */
    get varList() {
        return Object.keys(this._rawVars).filter(key => !this._localVars.has(key));
    }

    /**
     * Prevents a variable from being synchronized.
     * @param {string} key - The variable name.
     */
    unSync(key) {
        this._localVars.add(key);
    }

    /**
     * Joins a room.
     * @param {string} roomId - The room ID to join.
     * @param {string} [password=null] - Optional password for the room.
     */
    join(roomId, password = null) {
        this.roomId = roomId;
        this._network.send({ type: 'join', roomId, password, token: this.config.token });
    }

    _set(key, value) {
        if (this._rawVars[key] === value) return;
        if (!this._localVars.has(key)) {
            if (!this.joined) this._pendingSets.set(key, value);
            else this._network.send({ type: 'set', key, value, roomId: this.roomId });
        }
        this._rawVars[key] = value;
        this._emit(key, value);
        this._emit('*', value, key);
    }

    _onNetworkMessage(msg) {
        switch(msg.type) {
            case 'join_ok':
                this.joined = true;
                this.id = msg.id;
                this.clientList = msg.clients;
                Object.entries(msg.data).forEach(([k, v]) => {
                    this._rawVars[k] = v;
                    if (!this.name) this._linkToGlobal(k);
                    this._pendingSets.delete(k);
                    this._emit(k, v);
                });
                this._pendingSets.forEach((value, key) => {
                    this._network.send({ type: 'set', key, value, roomId: this.roomId });
                });
                this._pendingSets.clear();

                // システム変数の更新を通知
                ['ID','ROOM','COUNT'].forEach(k => {
                    const val = this._get(k);
                    this._emit(k, val);
                    this._emit('*', val, k); // 🌟 Bindingへの通知
                });
                this._emit('_joined', msg.roomId);
                break;
            case 'update':
                if (this._localVars.has(msg.key)) return;
                if (!this.name) this._linkToGlobal(msg.key);
                this._rawVars[msg.key] = msg.value;
                this._emit(msg.key, msg.value);
                this._emit('*', msg.value, msg.key);
                break;
            case 'client_join':
                if (!this.clientList.includes(msg.id)) {
                    this.clientList.push(msg.id);
                    this._emit('COUNT', this.clientList.length);
                    this._emit('*', this.clientList.length, 'COUNT'); // 🌟 Bindingへの通知
                    this._emit('_client_join', msg.id);
                }
                break;
            case 'client_leave':
                this.clientList = this.clientList.filter(id => id !== msg.id);
                this._emit('COUNT', this.clientList.length);
                this._emit('*', this.clientList.length, 'COUNT'); // 🌟 Bindingへの通知
                this._emit('_client_leave', msg.id);
                break;
        }
    }

    _linkToGlobal(key) {
        if (typeof window === 'undefined' || this.name) return;
        try {
            const desc = Object.getOwnPropertyDescriptor(window, key);
            if (desc && !desc.configurable) return;
            
            // 🌟 プロキシを介して動作させる
            Object.defineProperty(window, key, {
                get: () => this._proxy[key],
                set: (val) => { this._proxy[key] = val; },
                configurable: true,
                enumerable: true
            });
        } catch (e) {}
    }

    _emit(key, value, extra) {
        if (this._listeners.has(key)) {
            this._listeners.get(key).forEach(cb => key === '*' ? cb(extra, value) : cb(value));
        }
    }

    /**
     * Registers a callback for variable changes.
     * @param {string} key - The variable name, or '*' for all changes.
     * @param {function} callback - The callback function.
     */
    onChange(key, callback) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(callback);
    }

    _scanAndLink() {
        if (typeof document === 'undefined') return;
        const attrs = ['cv-bind', 'cv-local', 'cv-show', 'cv-hide', 'cv-class', 'cv-on'];
        const foundVars = new Set();
        const reserved = new Set(['true', 'false', 'null', 'undefined', 'click', 'submit', 'window', 'document', 'cv', 'CloudVar']);

        // システム定数もリンク対象
        ['BR', 'ID', 'ROOM', 'COUNT', 'TIME', 'RAND', 'TRUE', 'FALSE', 'NULL'].forEach(v => foundVars.add(v));

        document.querySelectorAll('[cv-local]').forEach(el => {
            if (this._binding.belongsToMe(el)) {
                const varName = el.getAttribute('cv-local');
                if (varName) foundVars.add(varName);
            }
        });

        attrs.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                if (this._binding.belongsToMe(el)) {
                    const val = el.getAttribute(attr);
                    const matches = val.matchAll(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
                    for (const match of matches) {
                        const varName = match[0];
                        if (!reserved.has(varName)) foundVars.add(varName);
                    }
                }
            });
        });

        foundVars.forEach(varName => {
            if (!this.name) this._linkToGlobal(varName);
            if (this._rawVars[varName] === undefined && !['BR','ID','COUNT','ROOM','TIME','RAND','TRUE','FALSE','NULL'].includes(varName)) {
                this._rawVars[varName] = "";
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.CloudVar = CloudVar;
}