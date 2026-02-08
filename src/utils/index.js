const utils = {
    randomId: () => Math.random().toString(36).substr(2, 9),
    debounce: (fn, ms) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), ms);
        };
    }
};

if (typeof window !== 'undefined') {
    window.CloudVarUtils = utils;
}