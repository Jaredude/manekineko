"use strict"
const axios = require('axios');

const fileman = require('../../fileman');

const G_RECORDCOUNT = 1000;

var CURRENCY_BASE, CURRENCY_DISPLAY;
var objMC, objTXs, fileTXtx, fileCR, fileCRch;

var A_portfolio;
var objRateHistory = {}; // We use this to log the URLs called to get the rate history so that we don't call the same URL more than once

var A_promises = []; // We're going to use this for handling the promises returned by the processors
var A_promises_portoflio_rates = [];
var A_promises_portoflio_rate_history = [];
var A_coins_portfolio = [];

var PORTFOLIOCOINLIST;

var iWait = 5000;

let config = {

}

// Should be defined in any processor
let processcount = 0;
let lastcall = Date.now();
let OutstandingCalls = () => processcount;
// End -- Should be defined in any processor


/*
    A_txs is assumged to the an array of transactions JSON objects for the supplied coin and address
    Required elements of A_tx
    hash: should be the block hash
    change: +/- to be applied towards the address
    time_utc: the time (in UTC, of course) when the transaction too place
    
    A_txs can have other attributes, and they will be ignored
*/
function ProcessCoinAddressTransactions(thecoin, theaddress, A_txs) {
    thecoin = thecoin.toUpperCase();
    let APItx = {};

    A_txs.forEach(function (elementtx) {
        let thehash = elementtx.hash;
        let thehash_API = APItx[thehash];
        let currency_display_value, currency_base_value;

        if (!thehash_API) { // If this hash doesn't exist on the API object create it so we can reuse it
            APItx[thehash] = {};
            thehash_API = APItx[thehash];
        }
        thehash_API.tx_value = (thehash_API.tx_value || 0) + elementtx.change; // add the tx change value
        thehash_API.time_utc = new Date(elementtx.time_utc).formatYYYYMMDD();

        if (!fileTXtx[thecoin]) { // Check for the coin under the transactions object
            fileTXtx[thecoin] = {};
        }
        if (!fileTXtx[thecoin][thehash]) { // Check for this hash under the transactions.coin
            fileTXtx[thecoin][thehash] = {};
        }

        // set objTXs values
        if (!objTXs.transactions[thecoin]) objTXs.transactions[thecoin] = {};
        if (!objTXs.transactions[thecoin][thehash]) objTXs.transactions[thecoin][thehash] = {};
        if (!objTXs.transactions[thecoin][thehash][theaddress]) objTXs.transactions[thecoin][thehash][theaddress] = {};

        // We're always going to use the values from the transaction pull
        let objhash = {
            "tx_value": thehash_API.tx_value
            // , "tx_value_satoshi": (thehash_API.tx_value / SATOSHI)
            , "time_utc": thehash_API.time_utc
        };

        objTXs.transactions[thecoin][thehash][theaddress] = objhash;
        // create the list of dates we need to pull historical transaction values for
        let needratehistory = false;
        if (!fileCRch[thehash_API.time_utc]) {
            needratehistory = true;
            fileCRch[thehash_API.time_utc] = { 'x': 'x'};
            console.log('no rate history for ' + thecoin + ' on ' + thehash_API.time_utc);
        } else {
            if (fileCRch[thehash_API.time_utc].x) {
                needratehistory = true;
            } else if (!fileCRch[thehash_API.time_utc][CURRENCY_BASE]) { // Not sure how we got to this state, but w/o a base we can't do anything.
                needratehistory = true;
            } else if (!fileCRch[thehash_API.time_utc][CURRENCY_BASE][thecoin]) {
                needratehistory = true;
                fileCRch[thehash_API.time_utc] = { 'x': 'x'};
                console.log('rate exists but not for ' + thecoin);
            } else {
                // console.log('rate history for ' + thecoin + ' on ' + thehash_API.time_utc + ' of: ' + fileCRch[thehash_API.time_utc][CURRENCY_BASE][thecoin]);
            }
        }

        if (needratehistory) {
            fileCRch[thehash_API.time_utc].x = 'x';
            // if (!objRateHistory[url_exchange_rate_historical]) {
            // }
        }
    });
}

let complete = (objP) => {
    let {sourceprocessors, processors, postprocessors} = objP;

    PortfolioRateUpdate({
        'callback': () => {
            Object.keys(postprocessors).forEach((value, index) => {
                console.log('starting: ' + value);
                // postprocess gets the existing transactions and the coin rate coin history
                postprocessors[value].process({
                    objMC, fileTXtx, fileCRch, CURRENCY_BASE, CURRENCY_DISPLAY, PORTFOLIOCOINLIST
                });
                console.log('completing: ' + value);
            })
        }
    });
}
function PortfolioRateUpdate(objParams) {
    objParams = objParams || {};
    let url_exchange_rates = '';

    url_exchange_rates = ReplaceCurrencyTemplate(
        {
            'URL': objMC.URL_EXCHANGE_RATES
            , 'CURRENCY_BASE': CURRENCY_BASE.toUpperCase()
            , 'CURRENCY_LIST_CSV': PORTFOLIOCOINLIST
        }
    );

    console.log(url_exchange_rates); // This is the URL that we can use to get the current exchange rates

    axios.get(url_exchange_rates)
        .then(response => {
            objMC.portfolio_rates = response.data;
            if (typeof objParams.callback === 'function') {
                try {
                    objParams.callback();
                } catch(e) {
                    console.log('Something did not work on callback: ' + e);
                }
            }
        })
        .catch(error => {
            console.log('Unable to process rates: ' + url_exchange_rates + ' ' + error);
        })
}

function ReplaceCurrencyTemplate(objParams) {
    let strReturn = objParams.URL;
    strReturn = strReturn.replace('<CURRENCY_BASE>', objParams.CURRENCY_BASE);
    strReturn = strReturn.replace('<CURRENCY_LIST_CSV>', objParams.CURRENCY_LIST_CSV);
    strReturn = strReturn.replace('<TX_TIMESTAMP>', objParams.TX_TIMESTAMP);
    return strReturn;
}

function WriteTXFiles() {
    // console.log('ending # of transactions: ' + Object.keys(objTXs.transactions).length);    
    let txjsonPromise = fileman.WriteObjectasJSONFile('tx.json', objTXs
    ).then((results) => {
        console.log(results);
    }).catch((err) => {
        console.log(err);
    });

}

function SetRateHistorical(response, thedate_utc) {
    if (response.data.MaxLimits || response.data.Response === 'Error') {
        console.log('Error: ' + response.data.Message + response.config.url);
        return;
    }

    let thedate = thedate_utc;
    if (!thedate_utc) {
        let myQS = querystring.parse(response.request.path.split('?')[1]);
        thedate = new Date(myQS.ts * 1000);
        thedate = thedate.formatYYYYMMDD();
    }
    if (!fileCRch[thedate]) {
        fileCRch[thedate] = { "x": "x" };
    } else if (fileCRch[thedate].x === 'x') {
        delete fileCRch[thedate].x;
    }

    fileCRch[thedate][CURRENCY_BASE] = response.data[CURRENCY_BASE];
    objRateHistory[response.config.url] = 'received';

    fileCR.coinratehistorycoins = PORTFOLIOCOINLIST;
    let coinratesjsonPromise = fileman.WriteObjectasJSONFile('coinrates.json', fileCR
    ).then((results) => {
        console.log(results + ' ' + thedate_utc);
    }).catch((err) => {
        console.log(err);
    });

}

function HistoricalRates() {
    let crh = fileCR.coinratehistory;
    let loopcount = 1;
    for (let elementCR in crh) {
        if (crh[elementCR].x === 'x') {
            setTimeout( () => {
                let url_exchange_rate_historical = ReplaceCurrencyTemplate(
                    {
                        'URL': objMC.URL_EXCHANGE_RATE_HISTORICAL
                        , 'CURRENCY_BASE': CURRENCY_BASE.toUpperCase()
                        , 'CURRENCY_LIST_CSV': PORTFOLIOCOINLIST
                        , 'TX_TIMESTAMP': (Date.parse(elementCR) / 1000)
                        , 'RECORDCOUNT': G_RECORDCOUNT
                    }
                );
        
                axios.get(url_exchange_rate_historical)
                    .then(response => {
                        SetRateHistorical(response, elementCR);
                        delete crh[elementCR].x;
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }, (iWait * loopcount * .5));
            loopcount++;
            loopcount = Math.min(loopcount, objMC.MAX_WAIT_COUNT_RATEHISTORY); // Don't wait longer than the specified iterations
        }
    };
    return loopcount;
}

let process = function ProcessPortofolio(objP) {
    let url_tx_coin = '';
    let {sourceprocessors, processors, postprocessors} = objP;

    objMC.portfolio.forEach(element => {    
        element.addresses.forEach((address) => {
            let theprocessor = element.processor || objMC.DEFAULT_PROCESSOR_TX;
            A_promises.push(processors[theprocessor].process({
                "COIN": element.symbol.toLowerCase()
                , "ADDRESS": address
                , "RECORDCOUNT": G_RECORDCOUNT
                , "TXPROCESSOR_MAIN": ProcessCoinAddressTransactions
            }));
        });
    });

    // Wait on the above to write the tx.json file
    axios.all(A_promises).then( (response) => {
        HistoricalRates(); // historical rates depend on the results we are geting from the processors
        WriteTXFiles();
    })

    PortfolioRateUpdate();
    console.log(objMC.currency_display);

    return;
}

let init = () => {
    // Get our base currency (most likely BTC) and our display currency (usually a fiat)
    objMC = fileman.ReadJSONFileasObject('config.json',
        {
            'callback': function (objMC) {
                CURRENCY_BASE = objMC.currency_base;
                CURRENCY_DISPLAY = objMC.currency_display;                        
            }
        }
    );

    objTXs = fileman.ReadJSONFileasObject('tx.json',
        {
            'callback': function(objTXs) {
                if (Object.keys(objTXs).length === 0) {
                    objTXs = {
                        "transactions": {}
                    }
                }                        
            }
            ,'default': { "transactions": {} }
        }
    );
    fileTXtx = objTXs.transactions;

    fileCR = fileman.ReadJSONFileasObject('coinrates.json', 
        {
            'callback': function(objCR) {
                if (Object.keys(objCR).length === 0 ) {
                    objCR = {
                        "coinratehistorycoins": ""
                        , "coinratehistory": {}        
                    }
                }
            }
            , 'default': {
                "coinratehistorycoins": ""
                , "coinratehistory": {}        
            }
        }
    );
    fileCRch = fileCR.coinratehistory;
    console.log('starting # of coin rates: ' + Object.keys(fileCRch).length);

    A_portfolio = [CURRENCY_BASE, CURRENCY_DISPLAY];
    objRateHistory = {}; // We use this to log the URLs called to get the rate history so that we don't call the same URL more than once
    
    A_promises = []; // We're going to use this for handling the promises returned by the processors
    A_promises_portoflio_rates = [];
    A_promises_portoflio_rate_history = [];
    A_coins_portfolio = [];
    
    A_coins_portfolio = objMC.portfolio.UniqueSymbols();
    
    Array.prototype.push.apply(A_portfolio, Object.keys(A_coins_portfolio)); // Build the array of currencies so we can get the latest values from the API
    let COINRATEHISTORYCOINS = fileCR.coinratehistorycoins;
    PORTFOLIOCOINLIST = [... new Set(A_portfolio)].join(',');
    if (COINRATEHISTORYCOINS !== PORTFOLIOCOINLIST) { // If the coins in the portfolio don't match what we have a history for, then we need to clear out the history
        objRateHistory = {}
        fileCR.coinratehistorycoins = PORTFOLIOCOINLIST;
    }
    
}

module.exports = {
    init
    , process
    , complete
    , OutstandingCalls
}

console.log('jsonfiles.js');