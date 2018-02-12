Date.prototype.formatYYYYMMDD = function () {
    return this.getUTCFullYear()
        + "-" + Zfirst((this.getUTCMonth() + 1))
        + "-" + Zfirst(this.getUTCDate());
};

function Zfirst(n) {
    return n < 10 ? '0' + n : '' + n;
}

Array.prototype.UniqueSymbols = function () {
    return this.reduce(
        (map, obj) => {
            if (obj.symbol) {
                map[obj.symbol.toUpperCase()] = obj.symbol;
                return map;
            }
        }
    , {}
    );
}