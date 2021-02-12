require('dotenv').config();
const fetch = require('node-fetch');
const axios = require('axios');

const Web3 = require('web3');
const rpcURLALK = process.env.RPC_URL_MAINNET_ALK;
const web3 = new Web3(rpcURLALK);

const pairs = require('./pairs');

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}


const init = async () => {

    const theGraphQuery = async (contractPair) => {
        try {
            const result = await axios.post(
                'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
                {
                    query: `
                    {
                        pair(id: "${contractPair}") {
                            token0 {                              
                                symbol                              
                                derivedETH
                            }        
                            token1 {
                                symbol
                            }                                     
                        }
                    }
                    `
                }
            )            
            
            const price = result.data.data.pair.token0.derivedETH;            
            const token0 = result.data.data.pair.token0.symbol;
            const token1 = result.data.data.pair.token1.symbol;
            return {price, token0, token1};
            
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    
    const sendPriceAlert = async (_token0, _token1, _currentPercentage, _price) => {
        try {
            const URI = process.env.ENDPOINT;
            const FULLURL = `${URI}sendMail?token0=${_token0}&token1=${_token1}&percent=${_currentPercentage}&price=${_price}`
            await fetch(FULLURL);     
            console.log('emailed');
        } catch (error) {
            console.log('sendPriceAlert', error);
            return null;
        }
    }    

    const doit = async (pairs) => {

        const uniQuery = await theGraphQuery(pairs.pair);
        const price = parseFloat(uniQuery.price);        
        const currentPercentage = ((( price - pairs.base) / pairs.base) * 100).toFixed(2);
        console.log(`(${uniQuery.token0}/${uniQuery.token1}): ${currentPercentage}% price: ${uniQuery.price}`);                                                
        
        if (currentPercentage >= pairs.targetPercentage || currentPercentage <= pairs.stopLostPercentage) {
            await sendPriceAlert(uniQuery.token0, uniQuery.token1, currentPercentage, price);            
            return true;
        }

        return false;

    }

    
    const tokenPairs = pairs.pairs;    
    const trackAmount = tokenPairs.length;
    const resetTime = 1800/trackAmount;    

    let count = 0;
    while(count < resetTime) {     

        for (let i = 0; i < tokenPairs.length; i++) {          

            if(tokenPairs[i].emailed == false) {
                const done = await doit(tokenPairs[i]);
                if(done) {                    
                    tokenPairs[i].emailed = true;
                }                
            }    
            
            await sleep(4000);              

        }    
        
        count ++;
        if(count >= resetTime) {
            count = 0;
            for (let i = 0; i < tokenPairs.length; i ++) {
                tokenPairs[i].emailed = false;
            }
        }

    }

}

init();


