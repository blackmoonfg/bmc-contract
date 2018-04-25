const Lock6m = artifacts.require("./Lockup6m.sol")
const BMCAssetProxy = artifacts.require("./BMCAssetProxy.sol")
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol")
let timeLock
const count = 4 //set count here;

module.exports = function(deployer) {
	deployer.deploy(Lock6m, BMCAssetProxy.address)
		.then(() => {
			const data = []
			for (i=0;i<count;i++) {
				data.push(Lock6m.new(BMCAssetProxy.address)
					.then(_timeLock => {
						console.log(_timeLock.address); timeLock = _timeLock
					})
					.then(_instance => {
						instance = _instance
					})
					.then(() => MultiEventsHistory.deployed())
					.then(_history => history = _history )
					.then(() => history.authorize(timeLock.address))
					.then(() => timeLock.setupEventsHistory(history.address)))
			}
			return Promise.all(data)
		})
		.then(() => console.log("[MIGRATION] [12] Time Lock: #done"))
}