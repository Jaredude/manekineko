![Maneki Neko the good luck coin tracking node app](https://raw.githubusercontent.com/Jaredude/manekineko/master/Maneki-Neko-PNG-Transparent-Image.png)

    Maneki is just a cat that keeps track of coins using a basic shell for running:
        source processors that control 
            tx processors
            and posttx processors

        A source processor is expected to have the following functions: init, process, complete
        + init should perform basic functionality, such as opening/loading a text file/db connection
            Optionally, the source processor init function could also be used to call an init function for each tx and/or txpost processor

        + process should perform the function of calling each of the tx processor process functions 
            and use the results to build on the file/db connection created under the source processor init calls

        + complete should perform basic functionality to clean up: e.g. writing a text file and/or closing a DB connection
            Optionally, the source processor complete function could also be used to call a complete function for each tx and/or txpost processor

****************************************************************************************************************************************************
    What Maneki comes with is processors that handle everything via json files. You could very easily train Maneki to use a DB instead of json files.

    The jsonfiles.js source processor will read a config.json file with the following structure:
    {
        "currency_display": "USD" This would typically be your fiat currency. Unless you transact only in crypto, you probably think in terms of fiat
        , "currency_base": "BTC" If you are bitcoin maximalist, this will be BTC. If you think in terms of LTC, then use LTC

        *** This can be any URL you want as long as you handle the call to the URL properly. cryptocompare.com has an AWESOME public API
        , "URL_EXCHANGE_RATES": "https://min-api.cryptocompare.com/data/price?fsym=<CURRENCY_BASE>&tsyms=<CURRENCY_LIST_CSV>" 

        *** This is where you want to get historical rates from. Since you likely pay taxes based upon the value of your mining at the time it is paid out
            , you need to know what the value of the currency was on the day you received it
        , "URL_EXCHANGE_RATE_HISTORICAL": "https://min-api.cryptocompare.com/data/pricehistorical?fsym=<CURRENCY_BASE>&tsyms=<CURRENCY_LIST_CSV>&ts=<TX_TIMESTAMP>&extraParams=maneki"

        *** Maneki has three built-in tx processors, and you can expand it to whatever you want as long as you handle how all the tx processing works in your source handler
        , "DEFAULT_PROCESSOR_TX": "chainz.cryptoid.info.js"
        , "MAX_WAIT_COUNT_RATEHISTORY": 30 // This is only something used within the jsonfiles.js source processor to avoid blowing up your wait time

        *** portfolio is an array of the currencies you've been mining, a processor of each currency, the addresses you want to track & how you want to track them
        *** the chainz.cryptoid.info.js tx processor uses the phenomanal API available through chainz.cryptoid.info to track your mining for a variety of top currencies
            You should definitely checkout the blockchains available on chainz.cryptoid.info as they have a TON of currencies available
        *** the api.etherescan.io.js tx processor uses the great API available through etherescan.io to track your mining for ETH
        *** nicehash.transactions.js tx processor processes the transactions.csv file provided by the popular nicehash mining platform.
        , "portfolio": [
            {
                "symbol": "btc"
                , "processor": "nicehash.transactions.js"
                , "addresses":[
                    {
                        "address": "nicehash-tx.csv"
                        *** This is currently NOT used for anything as of yet.
                            The idea here is that the type could be used for handling data so that you could build a service similar to some of the popular coing tracking web apps out there
                        , "type": "mining" 
                        *** Track is used within the chainz tx processor to include/exclude certain transactions
                        , "track": 1
                        *** 0 would only be used if you just want to make note of an address but not actually count any of the transactions
                        *** 1 would be for handling a mining address that is onchain with deposits moved by your service provider (i.e. CoinBase takes your mining deposit and moves it on chain, so you actual CoinBase address has a balance of 0 and CoinBase tracks your balance internally)
                        *** 2 would be useful for tracking addresses you might use for your mining expenses.
                        *** 3 tracking deposits and withdrawals
                        , "_track_options_": "MUST BE HANDLED IN THE PROCESSOR! 0: nothing; 1: deposits; 2: withdrawals; 3: both;"
                    }
                ]
            }            
        ]
    }

    Maneki was designed to ease the tracking of mining payouts for primarily BTC, LTC, ETH, DASH, and a handful of other currencies.
    Maneki was not designed to be tax software or to provide any insights in to how to mine or manage your cryptocurrency assets.
    Remember, Maneki is just a cat that keeps track of coins. You could possibly train (and by train, I mean program) Maneki to do other things.

    GOOD LUCK!
****************************************************************************************************************************************************
