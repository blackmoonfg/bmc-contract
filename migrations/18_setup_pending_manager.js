const NonOperationalWithdrawManager = artifacts.require("NonOperationalWithdrawManager")
const PendingManager = artifacts.require("PendingManager")
const path = require("path")

module.exports = deployer => {
	deployer.then(async () => {
		const pending = await PendingManager.deployed()
		await pending.signIn(NonOperationalWithdrawManager.address)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] PendingManager setup: #done")
	})
}
