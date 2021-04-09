import axios from 'axios';
import * as moment from 'moment';

process.env.TZ = "Asia/Shanghai";

const binance = axios.create({
  baseURL: 'https://www.binance.com',
});

const okex = axios.create({
  baseURL: 'https://www.okex.com',
});

const huobi = axios.create({
  baseURL: 'https://api.hbdm.com',
});

async function binanceFunding(coin: string, limit = 90) {
  const resp = await binance({
    method: 'post',
    url: '/gateway-api/v1/public/delivery/common/get-funding-rate-history',
    data: {
      page: 1,
      rows: limit,
      symbol: coin + 'USD_PERP'
    }
  });
  let totalRate = 0;
  resp.data.data.forEach(i => {
    totalRate += parseFloat(i.lastFundingRate);
  });
  totalRate = totalRate * 100;
  return totalRate.toFixed(3) + '%';
}

async function okexFunding(coin: string, limit = 90) {
  let totalRate = 0;
  let lastOneTime;
  for (let i = 0; i < Math.ceil(limit/100); i++) {
    const params = {
      limit: (limit - i * 100) >= 100 ? 100 : (limit - i * 100),
      instId: coin + '-USD-SWAP'
    }
    if (lastOneTime) {
      params['after'] = lastOneTime;
    }
    const resp = await okex({
      method: 'get',
      url: '/api/v5/public/funding-rate-history',
      params
    });
    resp.data.data.forEach(i => {
      totalRate += parseFloat(i.realizedRate);
    });
  }
  totalRate = totalRate * 100;
  return totalRate.toFixed(3) + '%';
}

async function huobiFunding(coin: string, limit = 90) {
  let totalRate = 0;
  for (let i = 0; i < Math.ceil(limit/50); i++) {
    const params = {
      page_index: i + 1,
      page_size: (limit - i * 50) >= 50 ? 50 : (limit - i * 50),
      contract_code: coin + '-USD'
    }
    const resp = await huobi({
      method: 'get',
      url: '/swap-api/v1/swap_historical_funding_rate',
      params
    });
    resp.data.data.data.forEach(i => {
      totalRate += parseFloat(i.realized_rate);
    });
  }
  totalRate = totalRate * 100;
  return totalRate.toFixed(3) + '%';
}

(async () => {
  const day = 5;
  console.log(`币本位合约最近${day}天资金费率总计：`);
  console.log('   ', 'binance', '  okex', '   huobi')
  const coinList = ['BTC', 'ETH', 'LINK', 'TRX', 'DOT', 'ADA', 'EOS', 'LTC', 'BCH', 'XRP', 'ETC', 'FIL'];
  for (const coin of coinList) {
    console.log(coin, await binanceFunding(coin, day * 3), ' ', await okexFunding(coin, day * 3), ' ', await huobiFunding(coin, day * 3));
  }
})().catch(error => {
    console.error(error);
});
