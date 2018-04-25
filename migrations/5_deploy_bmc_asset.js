const BMCAssetProxy = artifacts.require("./BMCAssetProxy.sol")
const BMCPlatform = artifacts.require("./BMCPlatform.sol")
const BMC = artifacts.require("./BMC.sol")

module.exports = deployer => {
	deployer.then(async() => {

		const BMC_SYMBOL = 'BMC'
		const BMC_NAME = 'Blackmoon Crypto Token'
		const BMC_DESCRIPTION = 'BMC blackmooncrypto.com asset'

		const BASE_UNIT = 8
		// const IS_REISSUABLE = true
		const IS_NOT_REISSUABLE = false

		const VALUE = 6000000000000000 // 30M * 2 * 10^8

		// Final ICO result
		const ICO_USD = 30000000
		const ICO_ETH = 73175
		const ICO_BTC = 1142
		const ICO_LTC = 32866

		await deployer.deploy(BMC)
		await deployer.deploy(BMCAssetProxy)

		const proxy = await BMCAssetProxy.deployed()
		const asset = await BMC.deployed()

		const platform = await BMCPlatform.deployed()
		await platform.issueAsset(BMC_SYMBOL, VALUE, BMC_NAME, BMC_DESCRIPTION, BASE_UNIT, IS_NOT_REISSUABLE)
		await platform.setProxy(proxy.address, BMC_SYMBOL)

		await asset.initBMC(proxy.address, ICO_USD, ICO_ETH, ICO_BTC, ICO_LTC)

		await proxy.init(platform.address, BMC_SYMBOL, BMC_NAME)
		await proxy.proposeUpgrade(BMC.address)

		console.log("[MIGRATION] [5] BMC ASSET: #done")
	})
}
