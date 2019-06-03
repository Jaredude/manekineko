"use strict"
const axios = require("axios");
const WEI = 1000000000000000000;

let config = {
    "URL_TX": "http://api.etherscan.io/api?module=account&action=txlist&address=<ADDRESS>&startblock=0&endblock=99999999&sort=asc&apikey=AUHUU3KHH3Z7XSGP4B1K7Q1NBKXNHDVPAW"
    , "APIKEY_TXS": "AUHUU3KHH3Z7XSGP4B1K7Q1NBKXNHDVPAW"
}

let processcount = 0;
let lastcall = Date.now();

let OutstandingCalls = () => processcount;

let process = function(objP) {
    let waittocall = 5000 - (Date.now() - lastcall);
    if (waittocall > 0) console.log(waittocall);
    processcount++;
    // console.log(objP);
    let url_tx_coin_address = '';
    let url_tx_coin = config.URL_TX; //.replace('<COIN>', objP.COIN);
    url_tx_coin_address = url_tx_coin.replace('<ADDRESS>', objP.ADDRESS.address);
    url_tx_coin_address = url_tx_coin_address.replace('<RECORDCOUNT>', objP.RECORDCOUNT);
    console.log('log:' + url_tx_coin_address); // This is the URL we're going to use to caputre all the txs
    let ret = axios.get(url_tx_coin_address)
        .then((response) => {
            let A_response = response.data.result.reduce((map, currentValue, currentIndex, array1) => {
                let include = objP.ADDRESS.track & 1; // Use bitwise op for determining if we should track the value or not
                if (include === 1) {
                    let thehash = currentValue.hash;
                    let thechange = currentValue.value / WEI;
                    let thetime_utc = new Date(currentValue.timeStamp * 1000);
                    map.push({
                        "hash": thehash
                        , "change": thechange
                        , "time_utc": thetime_utc
                    });
                }
                return map;

            }, []);
            objP.TXPROCESSOR_MAIN(objP.COIN, objP.ADDRESS.address, A_response)
            processcount--;
        }).catch((err) => {
            console.log(objP.COIN + ' ' + objP.ADDRESS);
            console.log(err);
            processcount--;
        })
    ;
    lastcall = Date.now();
    return ret;
}

module.exports = {
    process
    , OutstandingCalls
}

console.log('api.etherscan.io');