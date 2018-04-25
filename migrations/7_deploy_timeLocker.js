const TeamVesting = artifacts.require("./TeamVesting.sol")
const BMCAssetProxy = artifacts.require("./BMCAssetProxy.sol")
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol")

module.exports = function(deployer) {
	deployer.deploy(TeamVesting, BMCAssetProxy.address)
		.then(() => MultiEventsHistory.deployed())
		.then(_history => history = _history )
		.then(() => TeamVesting.deployed())
		.then(_timeLock => timeLock = _timeLock)
		.then(() => history.authorize(timeLock.address))
		.then(() => timeLock.setupEventsHistory(history.address))
		.then(() => console.log("[MIGRATION] [7] Time Lock: #done"))
}
