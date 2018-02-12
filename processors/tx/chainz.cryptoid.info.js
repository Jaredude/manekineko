"use strict"
const axios = require("axios");
const SATOSHI = 1e8;

let config = {
    "URL_TX": "https://chainz.cryptoid.info/<COIN>/api.dws?key=15703c430f49&q=multiaddr&n=<RECORDCOUNT>&active=<ADDRESS>"
    , "APIKEY_TXS": "15703c430f49"
    , "RECORDCOUNT": 100
}

let processcount = 0;
let lastcall = Date.now();

let OutstandingCalls = () => processcount;

let process = function(objP) {
    let waittocall = 5000 - (Date.now() - lastcall);
    // if (waittocall > 0) console.log(waittocall);
    processcount++;
    // console.log(objP);
    let url_tx_coin_address = '';            
    let url_tx_coin = config.URL_TX.replace('<COIN>', objP.COIN);
    url_tx_coin_address = url_tx_coin.replace('<ADDRESS>', objP.ADDRESS.address);
    url_tx_coin_address = url_tx_coin_address.replace('<RECORDCOUNT>', config.RECORDCOUNT.toString());
    // console.log(url_tx_coin_address); // This is the URL we're going to use to caputre all the txs
    let ret = axios.get(url_tx_coin_address)
        .then((response) => {
            let A_response = response.data.txs.reduce((map, currentValue, currentIndex, array1) => {
                let txvalue = currentValue.change / SATOSHI;
                let track = objP.ADDRESS.track;
                let include = false;

                if ((txvalue > 0 && track === 1) || (txvalue < 0 && track == 2) || (track === 3)) include = true;
                if (include) {
                    let thehash = currentValue.hash;
                    let thechange = txvalue;
                    let thetime_utc = currentValue.time_utc;
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

console.log('chainz.cryptoid.info');