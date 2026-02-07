class CloudVar {
    constructor(url, options = {}) {
        this.config = { url, token: options.token || 'default', mode: options.mode || 'ws', room: options.room || null };
        this.id = null;
        this.roomId = this.config.room;
        this.joined = false;
        this.clientList = [];
        this.blockList = new Set();
        
        this._rawVars = {};
        this._pendingSets = [];
        this._listeners = new Map();

        // モジュール初期化
        this._utils = typeof CloudVarUtils !== 'undefined' ? CloudVarUtils : null;
        this._network = new (typeof CloudVarNetwork !== 'undefined' ? CloudVarNetwork : null)(this);
        this._binding = new (typeof CloudVarBinding !== 'undefined' ? CloudVarBinding : null)(this);

        this._network.connect();

        // 🌟 HTML内をスキャンして、使われている変数をいきなり使えるようにする
        this._scanAndLink();

        return new Proxy(this, {
            get: (target, key) => {
                if (key in target || typeof key === 'symbol') return target[key];
                return target._rawVars[key];
            },
            set: (target, key, value) => {
                if (typeof key === 'string' && (key.startsWith('_') || key in target)) {
                    target[key] = value; return true;
                }
                if (typeof key === 'string') target._linkToGlobal(key);
                target._set(key, value);
                return true;
            }
        });
    }

    join(roomId, password = null) {
        this.roomId = roomId;
        this._network.send({ type: 'join', roomId, password, token: this.config.token });
    }

    _set(key, value) {
        // 現在の値と同じなら何もしない
        if (this._rawVars[key] === value) return;

        // ネットワーク送信
        const payload = { type: 'set', key, value, roomId: this.roomId };
        if (!this.joined) {
            // 重複を避けてキューに追加
            this._pendingSets = this._pendingSets.filter(p => p.key !== key);
            this._pendingSets.push(payload);
        } else {
            this._network.send(payload);
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
                Object.assign(this._rawVars, msg.data);
                while (this._pendingSets.length > 0) this._network.send(this._pendingSets.shift());
                Object.keys(this._rawVars).forEach(k => {
                    this._linkToGlobal(k);
                    this._emit(k, this._rawVars[k]);
                    this._emit('*', this._rawVars[k], k);
                });
                this._emit('_joined', msg.roomId);
                break;
            case 'update':
                this._linkToGlobal(msg.key);
                this._rawVars[msg.key] = msg.value;
                this._emit(msg.key, msg.value);
                this._emit('*', msg.value, msg.key);
                break;
            case 'client_join':
                if (!this.clientList.includes(msg.id)) this.clientList.push(msg.id);
                this._emit('_client_join', msg.id);
                break;
            case 'client_leave':
                this.clientList = this.clientList.filter(id => id !== msg.id);
                this._emit('_client_leave', msg.id);
                break;
        }
    }

    _linkToGlobal(key) {
        if (typeof window === 'undefined') return;
        try {
            const desc = Object.getOwnPropertyDescriptor(window, key);
            if (desc && !desc.configurable) return;

            // 既にCloudVarによって定義済みならスキップ
            if (desc && desc.set && desc.set._isCloudVar) return;

            const setter = (val) => this._set(key, val);
            setter._isCloudVar = true;

            Object.defineProperty(window, key, {
                get: () => this._rawVars[key],
                set: setter,
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

    onChange(key, callback) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(callback);
    }

    _scanAndLink() {
        if (typeof document === 'undefined') return;
        const attrs = ['cv-bind', 'cv-show', 'cv-hide', 'cv-class', 'cv-on'];
        const foundVars = new Set();
        // JSの予約語や既にあるプロパティを除外
        const reserved = new Set(['true', 'false', 'null', 'undefined', 'click', 'submit', 'window', 'document', 'cv']);

        attrs.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                const val = el.getAttribute(attr);
                // 🌟 全ての英単語を抽出
                const matches = val.matchAll(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
                for (const match of matches) {
                    const varName = match[0];
                    if (!reserved.has(varName)) foundVars.add(varName);
                }
            });
        });

        foundVars.forEach(varName => {
            this._linkToGlobal(varName);
            if (this._rawVars[varName] === undefined) this._rawVars[varName] = undefined;
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudVar;
}
if (typeof window !== 'undefined') {
    window.CloudVar = CloudVar;
}
