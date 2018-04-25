const FakeCoin = artifacts.require("./FakeCoin.sol")
const FakeCoin2 = artifacts.require("./FakeCoin2.sol")
const FakeCoin3 = artifacts.require("./FakeCoin3.sol")
const Stub = artifacts.require("./helpers/Stub.sol")
const Clock = artifacts.require("./Clock.sol")
const BMCPlatformTestable = artifacts.require("./BMCPlatformTestable.sol")
const ATxPlatformServiceAllowanceTestable = artifacts.require("./ATxPlatformServiceAllowanceTestable.sol")
const TokenSender = artifacts.require("./TokenSender.sol")
//const KrakenPriceTicker = artifacts.require("./KrakenPriceTicker.sol");

module.exports = function (deployer, network) {
	deployer.then(async () => {

		if (network !== 'development' && network !== 'test') {
			return
		}

		await deployer.deploy(Stub)
		await deployer.deploy(BMCPlatformTestable)
		await deployer.deploy(FakeCoin)
		await deployer.deploy(FakeCoin2)
		await deployer.deploy(FakeCoin3)
		await deployer.deploy(Clock)
		await deployer.deploy(TokenSender)
		await deployer.deploy(ATxPlatformServiceAllowanceTestable)
		//        await deployer.deploy(KrakenPriceTicker, true)

		console.log("[MIGRATION] [10] Deploy Test contracts: #done")
	})
}
