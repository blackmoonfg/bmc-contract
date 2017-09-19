const BuyBack = artifacts.require("./BuyBack.sol");
const DelayedPayments = artifacts.require("./DelayedPayments.sol");
const FakeCoin = artifacts.require("./FakeCoin.sol");
const FakeCoin2 = artifacts.require("./FakeCoin2.sol");
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");
const Reverter = require('./helpers/reverter');
const bytes32 = require('./helpers/bytes32');
const eventsHelper = require('./helpers/eventsHelper');
const Clock = artifacts.require('./Clock.sol')
const TimeMachine = require('./helpers/timemachine');
const ErrorsEnum = require("../common/errors");

contract('BuyBack', (accounts) => {
  let reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  let exchange;
  let coin;
  let delayedPayments;
  let delegate = '0x0';
  const BUY_PRICE = 1;
  const SELL_PRICE = 2570735391000000;
  const BALANCE = 1000;
  const BALANCE_ETH = 100;

  let assertBalance = (address, expectedBalance) => {
    return coin.balanceOf(address)
      .then((balance) => assert.equal(balance, expectedBalance));
  };

  let assertEthBalance = (address, expectedBalance) => {
    return Promise.resolve()
      .then(() => web3.eth.getBalance(address))
      .then((balance) => assert.equal(Math.round(balance.valueOf()/100000), Math.round(expectedBalance/100000)));
  };

  let getTransactionCost = (hash) => {
   const block = web3.eth.getBlock(`latest`);
   const gasPrice = web3.eth.gasPrice.c[0];
   console.log(gasPrice);
   return Promise.resolve().then(() =>
      hash.receipt.gasUsed * gasPrice);
  };

  before('Set Coin contract address', (done) => {
      var eventsHistory
      BuyBack.new()
      .then(instance => exchange = instance)
      .then(() => MultiEventsHistory.deployed())
      .then(instance => eventsHistory = instance)
      .then(() => exchange.setupEventsHistory(eventsHistory.address))
      .then(() => eventsHistory.authorize(exchange.address))
      .then(() => FakeCoin.deployed())
      .then(instance => coin = instance)
      .then(() => DelayedPayments.deployed())
      .then(instance => delayedPayments = instance)
      .then(() => coin.mint(accounts[0], BALANCE))
      .then(() => coin.mint(accounts[1], BALANCE))
      .then(() => coin.mint(exchange.address, BALANCE))
      .then(() => web3.eth.sendTransaction({to: exchange.address, value: BALANCE_ETH, from: accounts[0]}))
      .then(() => reverter.snapshot(done))
      .catch(done);
  });

  it('should receive the right contract address after init() call', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, coin.address));
  });

  it('should not be possible to set another contract after first init() call', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.init.call('0x1', delayedPayments.address))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INVALID_INVOCATION))
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, coin.address));
  });

  it('should not be possible to init by non-owner', () => {
    return exchange.init.call(coin.address, delayedPayments.address, {from: accounts[1]})
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => exchange.asset())
      .then((asset) => assert.equal(asset, '0x0000000000000000000000000000000000000000'));
  });

  it('should not be possible to set prices by non-owner', () => {
    return exchange.setPrices.call(10, 20, {from: accounts[1]})
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, BUY_PRICE))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, SELL_PRICE));
  });

  it('should be possible to set new prices', () => {
    let newBuyPrice = 10;
    let newSellPrice = 20;

    return exchange.setPrices(newBuyPrice, newSellPrice)
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, newBuyPrice))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, newSellPrice));
  });

  it('should not be possible to set prices sellPrice < buyPrice', () => {
    let newBuyPrice = 20;
    let newSellPrice = 10;

    return exchange.setPrices.call(newBuyPrice, newSellPrice)
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INVALID_PRICE))
      .then(() => exchange.buyPrice())
      .then((buyPrice) => assert.equal(buyPrice, BUY_PRICE))
      .then(() => exchange.sellPrice())
      .then((sellPrice) => assert.equal(sellPrice, SELL_PRICE));
  });

  it('should not be possible to sell with price > buyPrice', () => {
    let balance;
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => web3.eth.getBalance(accounts[0]))
      .then((result) => balance = result)
      .then(() => exchange.sell.call(1, BUY_PRICE + 1))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_TOO_HIGH_PRICE))
      //.then(getTransactionCost)
     // .then((txCost) => assertEthBalance(accounts[0], balance.sub(txCost).valueOf()))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to sell more than you have', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.sell.call(BALANCE + 1, BUY_PRICE))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INSUFFICIENT_BALANCE))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to sell tokens if exchange eth balance is less than needed', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.sell.call(BALANCE_ETH + 1, BUY_PRICE))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INSUFFICIENT_ETHER_SUPPLY))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should be possible to sell tokens', () => {
    let sellAmount = 50;
    let balance;
    let currentTime;
    let timeMachine = new TimeMachine(web3);
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => delayedPayments.authorizeSpender(exchange.address,true))
      .then(() => web3.eth.getBalance(accounts[0]))
      .then((result) => {balance = result; console.log(balance)})
      .then(() => exchange.sell.call(sellAmount, BUY_PRICE))
      .then((result) => assert.equal(result,ErrorsEnum.OK))
      .then(() => exchange.sell(sellAmount, BUY_PRICE))
      .then(getTransactionCost)
      .then((txCost) => {balance = balance.valueOf()-txCost*100000000000+sellAmount; console.log(txCost); assertEthBalance(accounts[0], balance)})
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH - sellAmount))
      .then(() => assertBalance(accounts[0], BALANCE - sellAmount))
      .then(() => assertBalance(exchange.address, BALANCE + sellAmount))
      .then(() => Clock.deployed())
      .then(_clock => clock = _clock)
      .then(() => delayedPayments.collectAuthorizedPayment(0))
      .then(getTransactionCost)
      .then((txCost) => {balance = balance.valueOf()-txCost*100000000000; console.log(txCost); assertEthBalance(accounts[0], balance)})
      .then(() => clock.time.call())
      .then(_time => currentTime = _time)
      .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
      .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setHours(currentDate.getHours() + 5);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
      })
      .then(() => clock.time.call())
      .then(_time => currentTime = _time)
      .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
      .then(() => delayedPayments.collectAuthorizedPayment(0))
      .then(getTransactionCost)
      .then(() => web3.eth.getBalance(accounts[0]))
      .then((result) => {balance = result; console.log(balance)})
      .then((txCost) => {balance = balance.valueOf()-txCost*100000000000; assertEthBalance(accounts[0], balance)})
    });

  it('should not be possible to withdraw tokens by non-owner', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawTokens.call(accounts[0], 10, {from: accounts[1]}))
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to withdraw if exchange token balance is less than _amount', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawTokens.call(accounts[0], BALANCE + 1))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INSUFFICIENT_BALANCE))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should withdraw tokens, and fire WithdrawTokens event', () => {
    let withdrawValue = 10;
    let watcher;
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => {
        eventsHelper.setupEvents(exchange);
        watcher = exchange.WithdrawTokens();
        return exchange.withdrawTokens(accounts[1], withdrawValue);
      })
      .then((txHash) => eventsHelper.getEvents(txHash, watcher))
      .then((events) => {
        assert.equal(events.length, 1);
        assert.equal(events[0].args.recipient.valueOf(), accounts[1]);
        assert.equal(events[0].args.amount.valueOf(), withdrawValue);
      })
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE + withdrawValue))
      .then(() => assertBalance(exchange.address, BALANCE - withdrawValue))
  });

  it('should not be possible to withdraw all tokens by non-owner', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawAllTokens.call(accounts[0], {from: accounts[1]}))
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(accounts[1], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE));
  });

  it('should not be possible to withdraw eth by non-owner', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawEth.call(accounts[0], 10, {from: accounts[1]}))
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should not be possible to withdraw if exchange eth balance is less than _amount', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawEth.call(accounts[0], BALANCE_ETH + 1))
      .then((r) => assert.equal(r, ErrorsEnum.EXCHANGE_INSUFFICIENT_ETHER_SUPPLY))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should withdraw eth, and fire WithdrawEth event', () => {
    let withdrawValue = 10;
    let withdrawTo = '0x0000000000000000000000000000000000000005';
    let watcher;
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => {
        eventsHelper.setupEvents(exchange);
        watcher = exchange.WithdrawEth();
        return exchange.withdrawEth(withdrawTo, withdrawValue);
      })
      .then((txHash) => eventsHelper.getEvents(txHash, watcher))
      .then((events) => {
        assert.equal(events.length, 1);
        assert.equal(events[0].args.recipient.valueOf(), withdrawTo);
        assert.equal(events[0].args.amount.valueOf(), withdrawValue);
      })
      .then(() => assertEthBalance(withdrawTo, withdrawValue))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH - withdrawValue));
  });

  it('should not be possible to withdraw all eth by non-owner', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawAllEth.call(accounts[0], {from: accounts[1]}))
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  it('should not be possible to withdraw all by non-owner', () => {
    return exchange.init(coin.address, delayedPayments.address)
      .then(() => exchange.withdrawAll.call(accounts[0], {from: accounts[1]}))
      .then((r) => assert.equal(r, ErrorsEnum.UNAUTHORIZED))
      .then(() => assertBalance(accounts[0], BALANCE))
      .then(() => assertBalance(exchange.address, BALANCE))
      .then(() => assertEthBalance(exchange.address, BALANCE_ETH));
  });

  let secondsToDate = (seconds) => {
     var t = new Date(1970, 0, 1); t.setSeconds(seconds);
     return t;
  }
});
