const GroupsAccessManager = artifacts.require("GroupsAccessManager")
const PendingManager = artifacts.require("PendingManager")
const path = require("path")

module.exports = deployer => {
	deployer.then(async () => {
		await deployer.deploy(PendingManager, GroupsAccessManager.address)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] PendingManager deploy: #done")
	})
}
