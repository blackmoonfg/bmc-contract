const NonOperationalWithdrawManager = artifacts.require("NonOperationalWithdrawManager")
const PendingManager = artifacts.require("PendingManager")
const path = require("path")

module.exports = deployer => {
	deployer.then(async () => {
		await deployer.deploy(NonOperationalWithdrawManager, PendingManager.address)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] NonOperationalWithdrawManager deploy: #done")
	})
}
