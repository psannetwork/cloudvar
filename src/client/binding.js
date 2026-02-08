class Binding {
    constructor(sdk) {
        this.sdk = sdk;
        this.setup();
    }

    setup() {
        if (typeof document === 'undefined') return;

        this.sdk.onChange('*', (key, value) => {
            this.updateAll(key, value);
        });

        document.addEventListener('input', (e) => {
            const key = e.target.getAttribute('cv-bind') || e.target.getAttribute('cv-local');
            if (key) {
                if (this.sdk._set) this.sdk._set(key, e.target.value);
                else this.sdk[key] = e.target.value;
            }
        });

        document.addEventListener('click', (e) => this.handleEvent(e, 'click'));
        document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'), true);

        window.addEventListener('DOMContentLoaded', () => this.scan());
    }

    handleEvent(e, eventName) {
        const target = (e.target.closest && e.target.closest(`[cv-on^="${eventName}:"]`)) || 
                     (e.currentTarget && e.currentTarget.getAttribute && e.currentTarget.getAttribute('cv-on')?.startsWith(eventName + ':') ? e.currentTarget : null);
        
        if (!target) {
            let el = e.target;
            while (el && el.getAttribute) {
                const attr = el.getAttribute('cv-on');
                if (attr && attr.startsWith(eventName + ':')) {
                    this._executeEvent(e, el);
                    return;
                }
                el = el.parentElement;
            }
            return;
        }

        this._executeEvent(e, target);
    }

    _executeEvent(e, element) {
        const attr = element.getAttribute('cv-on');
        const firstColonIndex = attr.indexOf(':');
        const expressionPart = attr.substring(firstColonIndex + 1);
        const expressions = expressionPart.split(';');

        e.preventDefault();
        expressions.forEach(expr => this.evaluate(expr.trim()));
    }

    evaluate(expr) {
        if (!expr) return;

        if (expr.startsWith('ALERT(') && expr.endsWith(')')) {
            alert(this.resolveValue(expr.slice(6, -1)));
            return;
        }
        if (expr.startsWith('LOG(') && expr.endsWith(')')) {
            console.log('[CloudVar]', this.resolveValue(expr.slice(4, -1)));
            return;
        }
        if (expr.startsWith('UNSYNC(') && expr.endsWith(')')) {
            this.sdk.unSync(expr.slice(7, -1).trim());
            return;
        }

        if (expr.includes('+=')) {
            const [key, valExpr] = expr.split('+=').map(s => s.trim());
            const val = this.resolveValue(valExpr);
            const current = this.sdk._rawVars ? this.sdk._rawVars[key] : this.sdk[key];
            this._setValue(key, (current || "") + val);
            return;
        }

        if (expr.includes('=')) {
            const [key, valExpr] = expr.split('=').map(s => s.trim());
            this._setValue(key, this.resolveValue(valExpr));
            return;
        }

        if (expr.endsWith('++')) {
            const key = expr.slice(0, -2).trim();
            const current = this.sdk._rawVars ? this.sdk._rawVars[key] : this.sdk[key];
            this._setValue(key, (Number(current) || 0) + 1);
        } else if (expr.endsWith('--')) {
            const key = expr.slice(0, -2).trim();
            const current = this.sdk._rawVars ? this.sdk._rawVars[key] : this.sdk[key];
            this._setValue(key, (Number(current) || 0) - 1);
        } else if (expr.startsWith('!')) {
            const key = expr.slice(1).trim();
            const current = this.sdk._rawVars ? this.sdk._rawVars[key] : this.sdk[key];
            this._setValue(key, !current);
        }
    }

    _setValue(key, value) {
        if (this.sdk._set) this.sdk._set(key, value);
        else this.sdk[key] = value;
    }

    resolveValue(valExpr) {
        if (!valExpr) return "";
        valExpr = valExpr.trim();

        switch(valExpr) {
            case 'BR': return '\n';
            case 'ID': return this.sdk.id || '';
            case 'ROOM': return this.sdk.roomId || '';
            case 'TIME': return Date.now();
            case 'RAND': return Math.random();
            case 'COUNT': return this.sdk.clientList.length;
            case 'TRUE': return true;
            case 'FALSE': return false;
            case 'NULL': return null;
        }
        
        if (valExpr.includes('+')) {
            return valExpr.split('+').map(part => this.resolveValue(part.trim())).join('');
        }

        if (/^['"].*['"]$/.test(valExpr)) {
            return valExpr.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
        }
        if (!isNaN(Number(valExpr)) && valExpr !== '') {
            return Number(valExpr);
        }
        const val = this.sdk._rawVars ? this.sdk._rawVars[valExpr] : this.sdk[valExpr];
        return val !== undefined ? val : "";
    }

    scan() {
        const vars = this.sdk._rawVars || {};
        Object.keys(vars).forEach(key => this.updateAll(key, vars[key]));
    }

    updateAll(key, value) {
        this.updateBind(key, value);
        this.updateShowHide(key, value);
        this.updateClass(key, value);
    }

    updateBind(key, value) {
        document.querySelectorAll(`[cv-bind="${key}"], [cv-local="${key}"]`).forEach(el => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                if (el.value !== String(value)) el.value = value;
            } else {
                if (el.innerText !== String(value)) el.innerText = value;
            }
        });
    }

    updateShowHide(key, value) {
        document.querySelectorAll(`[cv-show="${key}"]`).forEach(el => el.style.display = value ? '' : 'none');
        document.querySelectorAll(`[cv-hide="${key}"]`).forEach(el => el.style.display = value ? 'none' : '');
    }

    updateClass(key, value) {
        document.querySelectorAll(`[cv-class^="${key}:"]`).forEach(el => {
            const className = el.getAttribute('cv-class').split(':')[1].trim();
            if (value) el.classList.add(className);
            else el.classList.remove(className);
        });
    }
}

if (typeof window !== 'undefined') {
    window.CloudVarBinding = Binding;
}
