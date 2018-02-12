"use strict"
const fs = require('fs');

var fileTXcsv = fs.writeFileSync('tx.csv', 'coin,date,sat,base,display,current_base,current_display\r\n', function() { console.log('tx.csv cleared'); });

function Transactions2CSV(thecoin, thedate, thesatoshi, thebase, thedisplay, thebasenow, thedisplaynow) {
    fs.appendFileSync('tx.csv'
        , Object.keys(arguments).map((key,value) => { return arguments[key]; } ).join(',') + '\r\n'
        , function (err) { if (err) { throw err; }}
    );
}

function SumTransactions(objP) {
    let {objMC, fileTXtx, fileCRch, CURRENCY_BASE, CURRENCY_DISPLAY, PORTFOLIOCOINLIST} = objP;
    let objSum = {}

    Object.keys(fileTXtx).forEach((elementCoin, eIndex) => { // Loop through each coin
        objSum[elementCoin] = {};
        let thecoin = fileTXtx[elementCoin];
        let cointxcount = 0;
        let coinDisplayCurrent = 0;
        let coinsum = 0;
        let coinBase = 0;
        let coinDisplay = 0;

        Object.keys(thecoin).forEach((elementTx, etIndex) => { // Loop through each transaction
            Object.keys(thecoin[elementTx]).reduce((map, item) => { // Get each address value
            cointxcount++;                
            if (typeof thecoin[elementTx][item] === 'object') map.push(item); return map;}, []).forEach((elementAddress, eaIndex) => {
                if (thecoin[elementTx][elementAddress].tx_value > 0 && thecoin[elementTx][elementAddress].type !== 'transfer') {
                    if (!fileCRch[thecoin[elementTx][elementAddress].time_utc]) { // Somehow we are missing the rates for the date
                        fileCRch[thecoin[elementTx][elementAddress].time_utc] = { 'x': 'x' };
                        HistoricalRates();
                        console.log('rogue rates: ' + thecoin[elementTx][elementAddress].time_utc);
                    } else if (fileCRch[thecoin[elementTx][elementAddress].time_utc].x === 'x') {
                        // fileCRch[thecoin[elementTx][elementAddress].time_utc] = { 'x': 'x' };
                        console.log(`rogue rates for ${elementCoin}: ${thecoin[elementTx][elementAddress].time_utc})`);
                    } else {
                        coinsum += thecoin[elementTx][elementAddress].tx_value;
                        let txBaseAdd = (
                            thecoin[elementTx][elementAddress].tx_value
                            / fileCRch[thecoin[elementTx][elementAddress].time_utc][CURRENCY_BASE][elementCoin] // divided by the base currency (usually BTC))
                        );
                        coinBase += txBaseAdd;

                        let txDisplayAdd =  (
                            thecoin[elementTx][elementAddress].tx_value 
                            / fileCRch[thecoin[elementTx][elementAddress].time_utc][CURRENCY_BASE][elementCoin] // divided by the base currency (usually BTC)
                            * fileCRch[thecoin[elementTx][elementAddress].time_utc][CURRENCY_BASE][CURRENCY_DISPLAY] // multiplied by the display currency (e.g. fiat)
                        );
                        coinDisplay += txDisplayAdd;

                        let txBaseNow = (
                            thecoin[elementTx][elementAddress].tx_value
                            / objMC.portfolio_rates[elementCoin] // divided by the base currency (usually BTC))
                        );

                        let txDisplayNow = (
                            thecoin[elementTx][elementAddress].tx_value
                            / objMC.portfolio_rates[elementCoin] // divided by the base currency (usually BTC)
                            * objMC.portfolio_rates[CURRENCY_DISPLAY] // multiplied by the display currency (e.g. fiat)                        
                        );

                        Transactions2CSV(elementCoin, thecoin[elementTx][elementAddress].time_utc,thecoin[elementTx][elementAddress].tx_value, txBaseAdd, txDisplayAdd, txBaseNow, txDisplayNow);
                    }
                } else {
                    // console.log (thecoin + ': ' + elementTx + '; ' + thecoin[elementTx][elementAddress].type);
                }
            });
        }
        );
        // objSum[elementCoin].satoshi = coinsum;
        objSum[elementCoin].base_mined = coinBase;

        let coinBaseCurrent = coinsum / objMC.portfolio_rates[elementCoin.toUpperCase()];
        objSum[elementCoin].base_current = coinBaseCurrent;

        objSum[elementCoin].value_attx = coinDisplay;
        coinDisplayCurrent = objMC.portfolio_rates[CURRENCY_DISPLAY] * (coinsum / objMC.portfolio_rates[elementCoin.toUpperCase()]);
        objSum[elementCoin].value_current = coinDisplayCurrent;
        console.log(`${elementCoin} Total Mined: ${coinsum} on ${cointxcount} tx; ${CURRENCY_DISPLAY}: ${coinDisplay}; Current Value in ${CURRENCY_DISPLAY}: ${coinDisplayCurrent}; Current Value ${CURRENCY_BASE}: ${coinBaseCurrent}`);
    }
    );
    let Totals = Object.keys(objSum).reduce((sum,obj) => { 
        sum.value_attx += objSum[obj].value_attx;
        sum.value_current += objSum[obj].value_current;
        sum.base_mined += objSum[obj].base_mined;
        sum.base_current += objSum[obj].base_current;
        return sum;
    }, { base_current: 0, base_mined: 0, value_current: 0 , value_attx: 0});
    
    let TotalMined = Object.keys(objSum).reduce((sum,obj) => { return sum += objSum[obj].display}, 0);
    let CurrentValue = Object.keys(objSum).reduce((sum,obj) => { return sum += objSum[obj].current}, 0);
    console.log(`Total Mined (${CURRENCY_DISPLAY}): ${Totals.value_attx}; Current Value (${CURRENCY_DISPLAY}): ${Totals.value_current}; Base Mined: ${Totals.base_mined}; Base Current (${CURRENCY_BASE}): ${Totals.base_current}`);    
}

module.exports = {
    'process': SumTransactions
}