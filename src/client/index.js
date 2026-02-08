class CloudVar {
    constructor(url = 'wss://cloudvar.psannetwork.net', options = {}) {
        this.config = { url, token: options.token || 'default', mode: options.mode || 'ws', room: options.room || null };
        this.id = null;
        this.roomId = this.config.room;
        this.joined = false;
        this.clientList = [];
        this.blockList = new Set();
        
        this._rawVars = {};
        this._localVars = new Set();
        this._pendingSets = new Map();
        this._listeners = new Map();

        this._network = new (typeof CloudVarNetwork !== 'undefined' ? CloudVarNetwork : null)(this);
        this._binding = new (typeof CloudVarBinding !== 'undefined' ? CloudVarBinding : null)(this);

        this._network.connect();
        this._scanAndLink();

        return new Proxy(this, {
            get: (target, key) => {
                if (key === 'ID') return target.id || '';
                if (key === 'ROOM') return target.roomId || '';
                if (key === 'COUNT') return target.clientList.length;
                if (key === 'varList') return target.varList;

                if (key in target || typeof key === 'symbol') return target[key];
                return target._rawVars[key];
            },
            set: (target, key, value) => {
                if (typeof key === 'string' && key in target && !key.startsWith('_')) {
                    target[key] = value; return true;
                }
                if (typeof key === 'string') target._linkToGlobal(key);
                target._set(key, value);
                return true;
            }
        });
    }

    get varList() {
        return Object.keys(this._rawVars).filter(key => !this._localVars.has(key));
    }

    unSync(key) {
        this._localVars.add(key);
    }

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
                    this._linkToGlobal(k);
                    this._pendingSets.delete(k);
                    this._emit(k, v);
                });
                this._pendingSets.forEach((value, key) => {
                    this._network.send({ type: 'set', key, value, roomId: this.roomId });
                });
                this._pendingSets.clear();

                this._emit('ID', this.id);
                this._emit('ROOM', this.roomId);
                this._emit('COUNT', this.clientList.length);
                this._emit('_joined', msg.roomId);
                break;
            case 'update':
                if (this._localVars.has(msg.key)) return;
                this._linkToGlobal(msg.key);
                this._rawVars[msg.key] = msg.value;
                this._emit(msg.key, msg.value);
                this._emit('*', msg.value, msg.key);
                break;
            case 'client_join':
                if (!this.clientList.includes(msg.id)) this.clientList.push(msg.id);
                this._emit('COUNT', this.clientList.length);
                this._emit('_client_join', msg.id);
                break;
            case 'client_leave':
                this.clientList = this.clientList.filter(id => id !== msg.id);
                this._emit('COUNT', this.clientList.length);
                this._emit('_client_leave', msg.id);
                break;
        }
    }

    _linkToGlobal(key) {
        if (typeof window === 'undefined') return;
        try {
            const desc = Object.getOwnPropertyDescriptor(window, key);
            if (desc && !desc.configurable) return;
            if (desc && desc.set && desc.set._isCloudVar) return;
            const setter = (val) => this._set(key, val);
            setter._isCloudVar = true;
            Object.defineProperty(window, key, {
                get: () => this[key],
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
        const attrs = ['cv-bind', 'cv-local', 'cv-show', 'cv-hide', 'cv-class', 'cv-on'];
        const foundVars = new Set();
        const reserved = new Set(['true', 'false', 'null', 'undefined', 'click', 'submit', 'window', 'document', 'cv', 'CloudVar']);

        document.querySelectorAll('[cv-local]').forEach(el => {
            const varName = el.getAttribute('cv-local');
            if (varName) this._localVars.add(varName);
        });

        attrs.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                const val = el.getAttribute(attr);
                const matches = val.matchAll(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
                for (const match of matches) {
                    const varName = match[0];
                    if (!reserved.has(varName)) foundVars.add(varName);
                }
            });
        });

        foundVars.forEach(varName => {
            this._linkToGlobal(varName);
            if (this._rawVars[varName] === undefined && !['ID','COUNT','ROOM','TIME','RAND'].includes(varName)) {
                this._rawVars[varName] = undefined;
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.CloudVar = CloudVar;
}
