const Lockup6m = artifacts.require("./Lockup6m.sol");
const Lockup36m = artifacts.require("./Lockup36m.sol");
const TeamVesting = artifacts.require("./TeamVesting.sol");
const FakeCoin = artifacts.require("./FakeCoin.sol");
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");
const Clock = artifacts.require('./Clock.sol')
const TimeMachine = require('./helpers/timemachine');

contract('Lockup6m', (accounts) => {
    let coin;
    let lockup6m;
    let eventsHistory;
    let coinHolder = accounts[0];

    let timeMachine = new TimeMachine(web3);
    let clock;

    const INITIAL_BALANCE = 1000;
    const Errors = {OK:1, TIME_LOCK_TIMESTAMP_ERROR:51013};

    before('Initial setup', (done) => {
        FakeCoin.deployed()
            .then(_coin => coin = _coin)
            .then(() => coin.mint(coinHolder, INITIAL_BALANCE))
            .then(() => MultiEventsHistory.deployed())
            .then(_eventsHistory => eventsHistory = _eventsHistory)
            .then(() => Lockup6m.new(coin.address))
            .then(_lockup6m => lockup6m = _lockup6m)
            .then(() => lockup6m.setupEventsHistory(eventsHistory.address))
            .then(() => eventsHistory.authorize(lockup6m.address))
            .then(() => Clock.deployed())
            .then(_clock => clock = _clock)
            .then(() => done());
    });

    it('should lock balance', () => {
        return coin.transfer(lockup6m.address, 20, {from: coinHolder})
            .then(() => coin.balanceOf(lockup6m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
            .then(() => lockup6m.payIn.call())
            .then(r => assert.equal(r, Errors.OK))
            .then(() => lockup6m.payIn())
            .then(() => lockup6m.getLockedFunds.call())
            .then(_locked => assert.equal(_locked, 20))
            .then(() => lockup6m.payOut.call(coinHolder))
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
    });

    it('should not be able to return balance during next 6 months', () => {
        return lockup6m.payOut.call(coinHolder)
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
            .then(() => lockup6m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup6m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('should lock balance', () => {
        return lockup6m.payOut.call(coinHolder)
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
            .then(() => lockup6m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup6m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('time travel (+5months): go!', () => {
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 5);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should not be permited toreturn  balance yet', () => {
        return lockup6m.payOut.call(coinHolder)
            .then(() => lockup6m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup6m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('time travel (+1month): go!', () => {
        let currentTime;
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 1);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should return balance finally', () => {
        return lockup6m.payOut(coinHolder)
            .then(() => coin.balanceOf(lockup6m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 0))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE))
    });

    it('should be destroyed', () => {
        return lockup6m.eventsHistory.call()
            .then(_eventsHistory => assert.equal(_eventsHistory, '0x'))
    });
})

contract('Lockup36m', (accounts) => {
    let coin;
    let lockup36m;
    let eventsHistory;
    let coinHolder = accounts[0];

    let timeMachine = new TimeMachine(web3);
    let clock;

    const INITIAL_BALANCE = 1000;
    const Errors = {OK:1, TIME_LOCK_TIMESTAMP_ERROR:51013};

    before('Initial setup', (done) => {
        FakeCoin.deployed()
            .then(_coin => coin = _coin)
            .then(() => coin.mint(coinHolder, INITIAL_BALANCE))
            .then(() => MultiEventsHistory.deployed())
            .then(_eventsHistory => eventsHistory = _eventsHistory)
            .then(() => Lockup36m.new(coin.address))
            .then(_lockup36m => lockup36m = _lockup36m)
            .then(() => lockup36m.setupEventsHistory(eventsHistory.address))
            .then(() => eventsHistory.authorize(lockup36m.address))
            .then(() => Clock.deployed())
            .then(_clock => clock = _clock)
            .then(() => done());
    });

    it('should lock balance', () => {
        return coin.transfer(lockup36m.address, 20, {from: coinHolder})
            .then(() => coin.balanceOf(lockup36m.address))
            .then(_lockup6mBalance => assert.equal(_lockup6mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
            .then(() => lockup36m.payIn.call())
            .then(r => assert.equal(r, Errors.OK))
            .then(() => lockup36m.payIn())
            .then(() => lockup36m.getLockedFunds.call())
            .then(_locked => assert.equal(_locked, 20))
            .then(() => lockup36m.payOut.call(coinHolder))
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
    });

    it('should not be able to return balance during next 6 months', () => {
        return lockup36m.payOut.call(coinHolder)
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
            .then(() => lockup36m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup36m.address))
            .then(_lockup36mBalance => assert.equal(_lockup36mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('should lock balance', () => {
        return lockup36m.payOut.call(coinHolder)
            .then(r => assert.equal(r, Errors.TIME_LOCK_TIMESTAMP_ERROR))
            .then(() => lockup36m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup36m.address))
            .then(_lockup36mBalance => assert.equal(_lockup36mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('time travel (+35months): go!', () => {
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 35);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should not be permited to return balance yet', () => {
        return lockup36m.payOut.call(coinHolder)
            .then(() => lockup36m.payOut(coinHolder))
            .then(() => coin.balanceOf(lockup36m.address))
            .then(_lockup36mBalance => assert.equal(_lockup36mBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
    });

    it('time travel (+1month): go!', () => {
        let currentTime;
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 2);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should return balance finally', () => {
        return lockup36m.payOut(coinHolder)
            .then(() => coin.balanceOf(lockup36m.address))
            .then(_lockup36mBalance => assert.equal(_lockup36mBalance, 0))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE))
    });

    it('should be destroyed', () => {
        return lockup36m.eventsHistory.call()
            .then(_eventsHistory => assert.equal(_eventsHistory, '0x'))
    });
})

contract('TeamVesting', (accounts) => {
    let coin;
    let teamVesting;
    let eventsHistory;
    let coinHolder = accounts[0];

    let timeMachine = new TimeMachine(web3);
    let clock;

    const INITIAL_BALANCE = 1000;
    const Errors = {OK:1, TIME_LOCK_TIMESTAMP_ERROR:51013, TIME_LOCK_INVALID_INVOCATION:51017};

    before('Initial setup', (done) => {
        FakeCoin.deployed()
            .then(_coin => coin = _coin)
            .then(() => coin.mint(coinHolder, INITIAL_BALANCE))
            .then(() => MultiEventsHistory.deployed())
            .then(_eventsHistory => eventsHistory = _eventsHistory)
            .then(() => TeamVesting.new(coin.address))
            .then(_teamVesting => teamVesting = _teamVesting)
            .then(() => teamVesting.setupEventsHistory(eventsHistory.address))
            .then(() => eventsHistory.authorize(teamVesting.address))
            .then(() => Clock.deployed())
            .then(_clock => clock = _clock)
            .then(() => done());
    });

    it('should lock balance', () => {
        return coin.transfer(teamVesting.address, 20, {from: coinHolder})
            .then(() => coin.balanceOf(teamVesting.address))
            .then(_teamVestingBalance => assert.equal(_teamVestingBalance, 20))
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE - 20))
            .then(() => teamVesting.payIn.call())
            .then(r => assert.equal(r, Errors.OK))
            .then(() => teamVesting.payIn())
            .then(() => teamVesting.getLockedFunds.call())
            .then(_locked => assert.equal(_locked, 20))
            .then(() => teamVesting.payOut.call(coinHolder))
            .then(r => assert.equal(r, Errors.TIME_LOCK_INVALID_INVOCATION))
    });

    it('time travel (+6month): go!', () => {
        let currentTime;
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 6);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should return first batch', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 15)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-15))
    });

    it('should not return first batch twice', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 15)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-15))
    });

    it('time travel (+3month): go!', () => {
        let currentTime;
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 3);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should return second batch', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 13)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-13))
    });

    it('should not return second batch twice', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 13)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-13))
    });

    it('time travel (+6month): go!', () => {
        let currentTime;
        return clock.time.call()
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
            .then(() => {
                var currentDate = secondsToDate(currentTime);
                currentDate.setMonth(currentDate.getMonth() + 6);
                return timeMachine.jump(currentDate.getTime() / 1000 - currentTime);
            })
            .then(() => clock.time.call())
            .then(_time => currentTime = _time)
            .then(() => console.log("Testrpc current date:", secondsToDate(currentTime)))
    });

    it('should return forth batch', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 8)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-8))
    });

    it('should not return forth batch twice', () => {
        return teamVesting.payOut(coinHolder)
            .then(() => coin.balanceOf(teamVesting.address))
            .then((_teamVestingBalance) => {console.log(_teamVestingBalance); assert.equal(_teamVestingBalance, 8)})
            .then(() => coin.balanceOf(coinHolder))
            .then(_coinHolderBalance => assert.equal(_coinHolderBalance, INITIAL_BALANCE-8))
    });
})

let secondsToDate = (seconds) => {
    var t = new Date(1970, 0, 1); t.setSeconds(seconds);
    return t;
}
