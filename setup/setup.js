const BMCPlatform = artifacts.require('./BMCPlatform.sol')
const BMCAssetProxy = artifacts.require('./BMCAssetProxy.sol')
const BMC = artifacts.require('./BMC.sol')
const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol')
const contractTypes = {
}

let storage
let assetsManager
let walletsManager
let bmcPlatform
let contractsManager
let timeHolder
let timeHolderWallet
let shareable
let erc20Manager
let rewards
let voteActor
let pollManager
let pollDetails
let userManager
let exchangeManager
let bmc
let bmcAssetProxy
let multiEventsHistory
let storageManager

let accounts
let params
let paramsGas

var getAcc = function () {
  console.log('setup accounts')
  return new Promise(function (resolve, reject) {
    web3.eth.getAccounts((err, acc) => {
      console.log(acc);
      resolve(acc);
    })
  })
}

var exit = function () {
  process.exit()
}

var setup = function (callback) {
  return getAcc().then(r => {
    accounts = r
    params = {from: accounts[0]}
    paramsGas = {from: accounts[0], gas: 3000000}
    console.log('--done')
  }).then(() => {
    console.log('Instantiate the deployed contracts.')
    return Promise.all([
      BMCPlatform.deployed(),
      BMC.deployed(),
      BMCAssetProxy.deployed(),
      MultiEventsHistory.deployed(),
    ])
  }).then((instances) => {
    [
      bmcPlatform,
      bmc,
      bmcAssetProxy,
      multiEventsHistory,
    ] = instances
  }).then(() => {
    module.exports.bmcPlatform = bmcPlatform
    module.exports.bmc = bmc
    module.exports.bmcAssetProxy = bmcAssetProxy
    module.exports.multiEventsHistory = multiEventsHistory
  }).then(() => {
    callback()
  }).catch(function (e) {
    console.log(e)
    callback(e);
  })
}

module.exports.setup = setup
module.exports.contractTypes = contractTypes
