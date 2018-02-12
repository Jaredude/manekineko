"use strict"
// Nicehash transaction file for mining is CSV: Date,Comment,Amount[### BTC],BTC/USD
const SATOSHI = 1e8;
const papaparse = require('papaparse');
const fs = require('fs');

let config = {

}

// Should be defined in any processor
let processcount = 0;
let lastcall = Date.now();
let OutstandingCalls = () => processcount;
// End -- Should be defined in any processor

// process function is passed and object:
// {
//     "COIN": element.symbol.toLowerCase()
//     , "ADDRESS": address.address
//     , "RECORDCOUNT": G_RECORDCOUNT
//     , "TXPROCESSOR_MAIN": ProcessCoinAddressTransactions
// }

let process = function(objP) {
    processcount++;
    console.log(objP);
    let filelocation = objP.ADDRESS.address;
    let fileraw = fs.readFileSync(filelocation, 'utf8');
    let csv = papaparse.parse(fileraw, {
        header: true
    });

    let A_response = csv.data.reduce((map, currentValue, currentIndex, array1) => {
        //Date,Comment,Amount,BTC/USD
        let thehash = currentValue.Comment;
        let thechange = parseFloat(currentValue.Amount.split(' ')[0]);
        let thetime_utc = currentValue.Date;

// Set all the above correctly and you shouldn't have to make any changes to this push
        map.push({
            "hash": thehash
            , "change": thechange
            , "time_utc": thetime_utc
        });
        return map;

    }, []);
    objP.TXPROCESSOR_MAIN(objP.COIN, objP.ADDRESS, A_response)
    processcount--;
    ;
    lastcall = Date.now();
    return 0;
}

module.exports = {
    process
    , OutstandingCalls
}

console.log('nicehash.transactions.js');