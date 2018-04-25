const Setup = require('../setup/setup')
const eventsHelper = require('../../common/helpers/eventsHelper')
const error = require('../../common/errors.js')

const ATxPlatform = artifacts.require("./ATxPlatform.sol")

contract('ATxPlatform', function (accounts) {
	const owner = accounts[0]

	let platform

	before('Before', async () => {
		platform = await ATxPlatform.deployed()
		await Setup.snapshot()
	})

	afterEach('revert', async () => {
		await Setup.revert()
	})

	it("Should have possibility to issue asset", async() => {
		const success = await platform.issueAsset.call("TST", 500, "TST", "test", 3, true, { from: owner, })
		assert.equal(success, error.OK)

		await platform.issueAsset("TST", 500, "TST", "test", 3, true, { from: owner, })
		const [ , totalSupply, name, description, isReissuable, decimals, ] = await platform.assets.call("TST")

		assert.equal(totalSupply, 500)
		assert.equal(name, "TST")
		assert.equal(description, "test")
		assert.isTrue(isReissuable)
		assert.equal(decimals, 3)

		assert.isTrue(await platform.isCreated.call("TST"))
		assert.isFalse(await platform.isCreated.call("TST2"))
	})

	it("Should have possibility to issue asset to user", async() => {
		const account = accounts[1]

		var balance = await platform.balanceOf.call(account, "TST")
		assert.equal(balance, 0)

		const success = await platform.issueAssetToAddress.call("TST", 500, "TST", "test", 3, true, account, { from: owner, })
		assert.equal(success, error.OK)

		await platform.issueAssetToAddress("TST", 500, "TST", "test", 3, true, account, { from: owner, })

		balance = await platform.balanceOf.call(account, "TST")
		assert.equal(balance, 500)
	})

	it("Should be possible add part owner", async() => {
		const user1 = accounts[1]
		const user2 = accounts[2]
		const success = await platform.addPartOwner.call(user1, { from: owner, })
		assert.equal(success, error.OK)
		await platform.addPartOwner(user1, { from: owner, })

		const partowner = await platform.partowners.call(user1)
		assert.ok(partowner)

		const notPartOwner = await platform.partowners.call(user2)
		assert.ifError(notPartOwner)
	})

	it("Should be possible remove part owner", async() => {
		const user1 = accounts[1]
		const successAdd = await platform.addPartOwner.call(user1, { from: owner, })
		assert.equal(successAdd, error.OK)
		await platform.addPartOwner(user1, { from: owner, })

		var partowner = await platform.partowners.call(user1)
		assert.ok(partowner)

		const successDelete = await platform.removePartOwner.call(user1, { from: owner, })
		assert.equal(successDelete, error.OK)

		await platform.removePartOwner(user1, { from: owner, })

		partowner = await platform.partowners.call(user1)
		assert.isFalse(partowner)
	})

	it("Should be possible setup Event History", async() => {
		const historyAddress = '0x0000000000000000000000000000000000000001'
		var eventHistoryAddress = await platform.eventsHistory.call()
		assert.notEqual(eventHistoryAddress, historyAddress)

		await platform.setupEventsHistory(historyAddress, { from: owner, })

		eventHistoryAddress = await platform.eventsHistory.call()
		assert.equal(eventHistoryAddress, historyAddress)
	})

	it("Should be possible get symbol count", async() => {
		const count = await platform.symbolsCount.call()
		assert.equal(count.valueOf(), 0)
	})

	it("Should be possible get asset decimals", async() => {
		await platform.issueAsset("TST", 500, "TST", "test", 4, true, { from: owner, })

		const decimals = await platform.baseUnit.call("TST")
		assert.equal(decimals.valueOf(), 4)
	})

	it("Should be possible get name of asset", async() => {
		await platform.issueAsset("TST", 500, "TST1", "test", 4, true, { from: owner, })

		const name = await platform.name.call("TST")
		assert.equal(name, "TST1")
	})

	it("Should be possible get description of asset", async() => {
		await platform.issueAsset("TST", 500, "TST1", "test", 4, true, { from: owner, })

		const description = await platform.description.call("TST")
		assert.equal(description, "test")
	})

	it("Should be possible to check is reissuable asset", async() => {
		const notOwner = accounts[1]

		await platform.issueAsset("TST1", 500, "TST1", "test", 4, true, { from: owner, })
		await platform.issueAsset("TST2", 500, "TST2", "test", 4, false, { from: owner, })

		assert.isTrue(await platform.isReissuable.call("TST1"))
		assert.isFalse(await platform.isReissuable.call("TST2"))
		assert.isTrue(await platform.isOwner.call(owner, "TST1"))
		assert.isFalse(await platform.isOwner.call(notOwner, "TST1"))
		assert.isTrue(await platform.hasAssetRights.call(owner, "TST1"))
		assert.isFalse(await platform.hasAssetRights.call(notOwner, "TST1"))
	})

	it("Should be possible get total supply", async() => {
		const symbol = "TST1"

		await platform.issueAsset(symbol, 500, symbol, "test", 4, true, { from: owner, })

		const totalSupply = await platform.totalSupply.call(symbol)
		assert.equal(totalSupply.valueOf(), 500)
	})

	it("Should be possible make mass transfer", async() => {
		const account = accounts[1]
		const symbol = "TST1"

		await platform.issueAsset(symbol, 500, symbol, "test", 4, true, { from: owner, })

		var balance = await platform.balanceOf.call(account, symbol)
		assert.equal(balance.valueOf(), 0)

		const transfered = await platform.massTransfer.call([account,], [100,], symbol)
		assert(transfered[0], error.OK)
		assert(transfered[1], 100)

		await platform.massTransfer([account,], [100,], symbol, { from: owner, })

		balance = await platform.balanceOf.call(account, symbol)
		assert.equal(balance.valueOf(), 100)
	})

	it("Should be possible check balance of user", async() => {
		const account = accounts[0]

		await platform.issueAsset("TST1", 500, "TST1", "test", 4, true, { from: owner, })

		const balance = await platform.balanceOf.call(account, "TST1")
		assert.equal(balance.valueOf(), 500)
	})

	it("Should be possible add asset part owner", async() => {
		const partOwner = accounts[1]
		const symbol = "TST1"

		await platform.issueAsset(symbol, 500, symbol, "test", 4, true, { from: owner, })

		var result = await platform.checkIsAssetPartOwner.call(symbol, partOwner)
		assert.isFalse(result)

		result = await platform.addAssetPartOwner.call(symbol, partOwner, { from: owner, })
		assert.equal(result, error.OK)

		await platform.addAssetPartOwner(symbol, partOwner, { from: owner, })

		result = await platform.checkIsAssetPartOwner.call(symbol, partOwner)
		assert.isTrue(result)
	})

	it("Should be possible remove asset part owner", async() => {
		const partOwner = accounts[1]
		const symbol = "TST1"

		await platform.issueAsset(symbol, 500, symbol, "test", 4, true, { from: owner, })

		var result = await platform.checkIsAssetPartOwner.call(symbol, partOwner)
		assert.isFalse(result)

		await platform.addAssetPartOwner(symbol, partOwner, { from: owner, })

		result = await platform.checkIsAssetPartOwner.call(symbol, partOwner)
		assert.isTrue(result)

		result = await platform.removeAssetPartOwner.call(symbol, partOwner, { from: owner, })
		assert.equal(result, error.OK)

		await platform.removeAssetPartOwner(symbol, partOwner, { from: owner, })

		result = await platform.checkIsAssetPartOwner.call(symbol, partOwner)
		assert.isFalse(result)
	})

	it("Should be possible get holder id by address", async() => {
		const account = accounts[1]

		const id = await platform.getHolderId.call(account)
		assert(id !== 0)
	})

	it("Should be possible reissue asset", async() => {
		const symbol = "TST"

		await platform.issueAsset(symbol, 500, symbol, "test", 3, true, { from: owner, })

		const [ , totalSupplyBefore, ] = await platform.assets.call(symbol)
		assert.equal(totalSupplyBefore, 500)

		var result = await platform.reissueAsset.call(symbol, 300, { from: owner, })
		assert.equal(result, error.OK)

		await platform.reissueAsset(symbol, 300, { from: owner, })

		const [ , totalSupplyAfter, ] = await platform.assets.call(symbol)
		assert.equal(totalSupplyAfter, 800)
	})

	it("Should be possible revoke asset", async() => {
		const symbol = "TST"

		await platform.issueAsset(symbol, 500, symbol, "test", 3, true, { from: owner, })
		const [ , totalSupplyBefore, ] = await platform.assets.call(symbol)

		assert.equal(totalSupplyBefore, 500)

		const result = await platform.revokeAsset.call(symbol, 300, { from: owner, })
		assert.equal(result, error.OK)
		await platform.revokeAsset(symbol, 300, { from: owner, })

		const [ , totalSupplyAfter, ] = await platform.assets.call(symbol)
		assert.equal(totalSupplyAfter, 200)

	})

	it("Should be possible to change ownership of asset", async() => {
		const symbol = "TST"
		const user1 = owner
		const user2 = accounts[1]

		await platform.issueAsset(symbol, 500, "TST", "test", 3, true, { from: owner, })

		var isOwner = await platform.isOwner.call(user1, symbol)
		assert.isTrue(isOwner)

		isOwner = await platform.isOwner.call(user2, symbol)
		assert.isFalse(isOwner)

		var result = await platform.changeOwnership.call(symbol, user2, { from: user1, })
		assert.equal(result, error.OK)

		await platform.changeOwnership(symbol, user2, { from: user1, })

		isOwner = await platform.isOwner.call(user1, symbol)
		assert.isFalse(isOwner)

		isOwner = await platform.isOwner.call(user2, symbol)
		assert.isTrue(isOwner)

	})

	it("Should be possible to add trusted", async() => {
		var user1 = owner
		var user2 = accounts[1]

		var result = await platform.isTrusted.call(user2, user1)
		assert.isFalse(result)

		result = await platform.trust.call({ from: user2, })
		assert.equal(result, error.OK)

		await platform.trust({ from: user2, })

		result = await platform.isTrusted.call(user2, user1)
		assert.isTrue(result)
	})

	it("Should be possible to remove trusted by non contract owner", async() => {

		var user1 = owner
		var user2 = accounts[1]

		await platform.trust({ from: user2, })

		var result = await platform.isTrusted.call(user2, user1)
		assert.isTrue(result)

		result = await platform.distrust.call({ from: user2, })
		assert.equal(result.valueOf(), error.OK)

		await platform.distrust({ from: user2, })

		result = await platform.isTrusted.call(user2, user1)
		assert.isFalse(result)

	})

	it('should be possible to recover by owner if trusted', async() => {
		const symbol = "TST"
		const holder = accounts[1]
		const recoverTo = accounts[2]

		await platform.issueAssetToAddress(symbol, 500, symbol, "test", 3, true, holder, { from: owner, })
		await platform.trust({ from: holder, })

		var result = await platform.balanceOf.call(recoverTo, symbol)
		assert.equal(result.valueOf(), 0)

		const txHash = await platform.recover(holder, recoverTo, { from: owner, })

		const events = await eventsHelper.findEvent([platform,], txHash, "Recovery")
		assert.lengthOf(events, 1)
		const event = events[0]
		assert.equal(event.args.from.valueOf(), holder)
		assert.equal(event.args.to.valueOf(), recoverTo)
		assert.equal(event.args.by.valueOf(), owner)

		result = await platform.balanceOf.call(recoverTo, symbol)
		assert.equal(result.valueOf(), 500)

	})

	it('should be possible to recover multiple times by owner if trusted', async() => {
		const symbol = "TST"
		const holder = accounts[1]
		const recoverTo = accounts[2]
		const recoverTo2 = accounts[3]

		await platform.issueAssetToAddress(symbol, 500, symbol, "test", 3, true, holder, { from: owner, })
		await platform.trust({ from: holder, })

		await platform.recover(holder, recoverTo, { from: owner, })
		await platform.recover(recoverTo, recoverTo2, { from: owner, })

		const result = await platform.balanceOf.call(recoverTo2, symbol)
		assert.equal(result.valueOf(), 500)
	})

	it('should be possible to recover recovered address by owner if trusted', async() => {
		const symbol = "TST"
		const holder = accounts[1]
		const recoverTo = accounts[2]
		const recoverTo2 = accounts[3]

		await platform.issueAssetToAddress(symbol, 500, symbol, "test", 3, true, holder, { from: owner, })
		await platform.trust({ from: holder, })

		await platform.recover(holder, recoverTo, { from: owner, })
		const txHash = await platform.recover(recoverTo, recoverTo2, { from: owner, })
		const events = await eventsHelper.findEvent([platform,], txHash, "Recovery")

		assert.lengthOf(events, 1)
		const event = events[0]
		assert.equal(event.args.from.valueOf(), recoverTo)
		assert.equal(event.args.to.valueOf(), recoverTo2)
		assert.equal(event.args.by.valueOf(), owner)

		const result = await platform.balanceOf.call(recoverTo2, symbol)
		assert.equal(result.valueOf(), 500)
	})

})
