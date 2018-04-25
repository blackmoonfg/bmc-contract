const GroupsAccessManager = artifacts.require("GroupsAccessManager")
const path = require("path")

module.exports = deployer => {
	deployer.then(async () => {
		await deployer.deploy(GroupsAccessManager)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] GroupsAccessManager deploy: #done")
	})
}
