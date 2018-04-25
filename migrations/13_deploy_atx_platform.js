const Platform = artifacts.require("ATxPlatform")
const path = require("path")

module.exports = deployer => {
	deployer.then(async() => {
		await deployer.deploy(Platform)

		console.log("[MIGRATION] [" + parseInt(path.basename(__filename)) + "] ATx Platform deploy: #done")
	})
}
