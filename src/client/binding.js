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
            const key = e.target.getAttribute('cv-bind');
            if (key) this.sdk[key] = e.target.value;
        });

        document.addEventListener('click', (e) => this.handleEvent(e, 'click'));
        document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'), true);

        window.addEventListener('DOMContentLoaded', () => this.scan());
    }

    handleEvent(e, eventName) {
        // 🌟 target (実際にクリック等された要素) または currentTarget (formなど) から属性を探す
        const target = (e.target.closest && e.target.closest(`[cv-on^="${eventName}:"]`)) || 
                     (e.currentTarget && e.currentTarget.getAttribute && e.currentTarget.getAttribute('cv-on')?.startsWith(eventName + ':') ? e.currentTarget : null);
        
        if (!target) {
            // もし見つからなければ、さらに親を辿る（バブリング対策）
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
        // console.log('Evaluating:', expr); // デバッグ用

        // key += value (追記)
        if (expr.includes('+=')) {
            const [key, valExpr] = expr.split('+=').map(s => s.trim());
            const val = this.resolveValue(valExpr);
            this.sdk[key] = (this.sdk[key] || "") + val;
            return;
        }

        // key = value (代入)
        if (expr.includes('=')) {
            const [key, valExpr] = expr.split('=').map(s => s.trim());
            this.sdk[key] = this.resolveValue(valExpr);
            return;
        }

        // ++ / --
        if (expr.endsWith('++')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) + 1;
        } else if (expr.endsWith('--')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) - 1;
        } else if (expr.startsWith('!')) {
            const key = expr.slice(1).trim();
            this.sdk[key] = !this.sdk[key];
        }
    }

    resolveValue(valExpr) {
        if (!valExpr) return "";
        
        // 文字列の足し算 'a' + b + 'c'
        if (valExpr.includes('+')) {
            return valExpr.split('+').map(part => this.resolveValue(part.trim())).join('');
        }

        // 文字列定数 'hello' "world"
        if (/^['"].*['"]$/.test(valExpr)) {
            return valExpr.replace(/^['"]|['"]$/g, '');
        }
        // 数値
        if (!isNaN(Number(valExpr)) && valExpr !== '') {
            return Number(valExpr);
        }
        // 他の変数名
        const val = this.sdk[valExpr];
        // 🌟 変数が存在しないか undefined の場合は、
        // 文字列結合なら空文字、数値演算なら0として扱う
        return val !== undefined ? val : "";
    }

    scan() {
        Object.keys(this.sdk._rawVars).forEach(key => this.updateAll(key, this.sdk._rawVars[key]));
    }

    updateAll(key, value) {
        this.updateBind(key, value);
        this.updateShowHide(key, value);
        this.updateClass(key, value);
    }

    updateBind(key, value) {
        document.querySelectorAll(`[cv-bind="${key}"]`).forEach(el => {
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

if (typeof module !== 'undefined') {
    module.exports = Binding;
}
if (typeof window !== 'undefined') {
    window.CloudVarBinding = Binding;
}