const MultiEventsHistory = artifacts.require("MultiEventsHistory")
const Platform = artifacts.require("ATxPlatform")
const path = require("path")

module.exports = deployer => {
	deployer.then(async () => {
		const platform = await Platform.deployed()
		const history = await MultiEventsHistory.deployed()

		await history.authorize(platform.address)
		await platform.setupEventsHistory(history.address)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] ATx Platform init: #done")
	})
}
