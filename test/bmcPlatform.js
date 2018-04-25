const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol")
const BMCPlatformTestable = artifacts.require("./BMCPlatformTestable.sol")

const Setup = require('./setup/setup.js')
const bytes32 = require('../common/helpers/bytes32')
const ErrorsEnum = require("../common/errors")
const eventsHelper = require('../common/helpers/eventsHelper')

contract('BMCPlatform', function(accounts) {
	const setup = new Setup()
	setup.init()

	var UINT_256_MINUS_3 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639933e+77'
	var UINT_256_MINUS_2 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639934e+77'
	var UINT_256_MINUS_1 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77'
	var UINT_256 = '1.15792089237316195423570985008687907853269984665640564039457584007913129639936e+77'
	var UINT_255_MINUS_1 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819967e+76'
	var UINT_255 = '5.7896044618658097711785492504343953926634992332820282019728792003956564819968e+76'

	var BYTES_32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
	var BITS_257 = '0x10000000000000000000000000000000000000000000000000000000000000000'
	var ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

	var SYMBOL = bytes32(100)
	var NAME = 'Test Name'
	var DESCRIPTION = 'Test Description'
	var VALUE = 1001
	var BASE_UNIT = 2
	var IS_REISSUABLE = false

	var bmcPlatform
	var multiEventsHistory

	before('setup', function (done) {
		setup.beforeAll()
			.then(() => BMCPlatformTestable.deployed())
			.then(instance => bmcPlatform = instance)
			.then(() => MultiEventsHistory.deployed())
			.then(instance => multiEventsHistory = instance)
			.then(() => bmcPlatform.setupEventsHistory(multiEventsHistory.address)
				.then(() => multiEventsHistory.authorize(bmcPlatform.address)
					.then(() => setup.reverter.snapshot(done))
					.then(() => console.log("setup completed"))))
			.catch(e => {
				console.log("setup failed" + e)
				done(e)
			})
	})

	context("with one CBE key", function(){
		it('should not be possible to issue asset with existing symbol', function() {
			var symbol = SYMBOL
			var value = 1001
			var value2 = 3021
			var name = 'Test Name'
			var name2 = '2Test Name2'
			var description = 'Test Description'
			var description2 = '2Test Description2'
			var baseUnit = 2
			var baseUnit2 = 4
			var isReissuable = false
			var isReissuable2 = true
			return bmcPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function() {
				return bmcPlatform.issueAsset(symbol, value2, name2, description2, baseUnit2, isReissuable2)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Issue")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), name)
				return bmcPlatform.totalSupply.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.description.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), description)
				return bmcPlatform.baseUnit.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), baseUnit)
				return bmcPlatform.isReissuable.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), isReissuable)
			})
		})
		it('should not be possible to issue asset by not platform owner', function() {
			var nonOwner = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE, { from: nonOwner, }).then(function() {
				return bmcPlatform.isCreated.call(SYMBOL)
			}).then(function(result) {
				assert.isFalse(result)
			})
		})
		it('should be possible to issue asset with 1 bit 0 symbol', function() {
			var symbol = SYMBOL
			return bmcPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), NAME)
			})
		})
		it('should be possible to issue asset with 1 bit 1 symbol', function() {
			var symbol = bytes32(200)
			return bmcPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), NAME)
			})
		})
		it('should be possible to issue asset with 32 bytes symbol', function() {
			var symbol = BYTES_32
			return bmcPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), NAME)
			})
		})
		it('should not be possible to issue fixed asset with 0 value', function() {
			var value = 0
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.name.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), '')
			})
		})
		it('should be possible to issue fixed asset with 1 value', function() {
			var value = 1
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to issue fixed asset with (2**256 - 1) value', function() {
			var value = UINT_256_MINUS_1
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to issue reissuable asset with 0 value', function() {
			var value = 0
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.name.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), NAME)
			})
		})
		it('should be possible to issue reissuable asset with 1 value', function() {
			var value = 1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to issue reissuable asset with (2**256 - 1) value', function() {
			var value = UINT_256_MINUS_1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to issue asset with base unit 1', function() {
			var baseUnit = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(function() {
				return bmcPlatform.baseUnit.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 1)
			})
		})
		it('should be possible to issue asset with base unit 255', function() {
			var baseUnit = 255
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, baseUnit, IS_REISSUABLE).then(function() {
				return bmcPlatform.baseUnit.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 255)
			})
		})
		it('should be possible to issue asset', function() {
			var symbol = SYMBOL
			var value = 1001
			var name = 'Test Name'
			var description = 'Test Description'
			var baseUnit = 2
			var isReissuable = false
			return bmcPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Issue")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.symbol.valueOf(), symbol)
				assert.equal(events[0].args.value.valueOf(), value)
				assert.equal(events[0].args.by.valueOf(), accounts[0])
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), name)
				return bmcPlatform.totalSupply.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.description.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), description)
				return bmcPlatform.baseUnit.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), baseUnit)
				return bmcPlatform.isReissuable.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), isReissuable)
			})
		})
		it('should be possible to issue multiple assets', function() {
			var symbol = SYMBOL
			var symbol2 = bytes32(200)
			var owner = accounts[0]
			var value = 1001
			var value2 = 3021
			var name = 'Test Name'
			var name2 = '2Test Name2'
			var description = 'Test Description'
			var description2 = '2Test Description2'
			var baseUnit = 2
			var baseUnit2 = 4
			var isReissuable = false
			var isReissuable2 = true
			return bmcPlatform.issueAsset(symbol, value, name, description, baseUnit, isReissuable).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, name2, description2, baseUnit2, isReissuable2)
			}).then(function() {
				return bmcPlatform.name.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), name)
				return bmcPlatform.name.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), name2)
				return bmcPlatform.totalSupply.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
				return bmcPlatform.description.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), description)
				return bmcPlatform.description.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), description2)
				return bmcPlatform.baseUnit.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), baseUnit)
				return bmcPlatform.baseUnit.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), baseUnit2)
				return bmcPlatform.isReissuable.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), isReissuable)
				return bmcPlatform.isReissuable.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), isReissuable2)
				return bmcPlatform.owner.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
				return bmcPlatform.owner.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
			})
		})
		it('should be possible to get asset name', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.name.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), NAME)
			})
		})
		it('should be possible to get asset description', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.description.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), DESCRIPTION)
			})
		})
		it('should be possible to get asset base unit', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.baseUnit.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), BASE_UNIT)
			})
		})
		it('should be possible to get asset reissuability', function() {
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.isReissuable.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), isReissuable)
			})
		})
		it('should be possible to get asset owner', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), accounts[0])
			})
		})
		it('should be possible to check if address is asset owner', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.isOwner.call(accounts[0], SYMBOL)
			}).then(function(result) {
				assert.isTrue(result.valueOf())
			})
		})
		it('should be possible to check if address is owner of non-existing asset', function() {
			bmcPlatform.isOwner.call(accounts[0], SYMBOL).then(function(result) {
				assert.isFalse(result.valueOf())
			})
		})
		it('should be possible to check if asset is created', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.isCreated.call(SYMBOL)
			}).then(function(result) {
				assert.isTrue(result.valueOf())
			})
		})
		it('should be possible to check if asset is created for non-existing asset', function() {
			bmcPlatform.isCreated.call(SYMBOL).then(function(result) {
				assert.isFalse(result.valueOf())
			})
		})
		it('should be possible to get asset total supply with single holder', function() {
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to get asset total supply with multiple holders', function() {
			var amount = 1001
			var amount2 = 999
			var holder2 = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, amount + amount2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, amount2, SYMBOL)
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount + amount2)
			})
		})
		it('should be possible to get asset total supply with multiple holders holding 0 amount', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, VALUE, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder, VALUE, SYMBOL, { from: holder2, })
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, VALUE)
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to get asset total supply with multiple holders holding (2**256 - 1) amount', function() {
			var value = UINT_256_MINUS_1
			var holder = accounts[0]
			var holder2 = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, 10, SYMBOL)
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to get asset balance for holder', function() {
			var owner = accounts[0]
			var symbol2 = bytes32(10)
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, VALUE-10, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to get asset balance for non owner', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should be possible to get asset balance for missing holder', function() {
			var nonOwner = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to get missing asset balance for holder', function() {
			var nonAsset = 'LHNONEXIST'
			var owner = accounts[0]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.balanceOf.call(owner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to get missing asset balance for missing holder', function() {
			var nonAsset = 'LHNONEXIST'
			var nonOwner = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to get name of missing asset', function() {
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.name.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), '')
			})
		})
		it('should not be possible to get description of missing asset', function() {
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.description.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), '')
			})
		})
		it('should not be possible to get base unit of missing asset', function() {
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.baseUnit.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to get reissuability of missing asset', function() {
			var nonAsset = 'LHNONEXIST'
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.isReissuable.call(nonAsset)
			}).then(function(result) {
				assert.isFalse(result)
			})
		})
		it('should not be possible to get owner of missing asset', function() {
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.owner.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), ADDRESS_ZERO)
			})
		})
		it('should not be possible to get total supply of missing asset', function() {
			bmcPlatform.totalSupply.call(SYMBOL).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to change ownership by non-owner', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, nonOwner, { from: nonOwner, })
			}).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
			})
		})
		it('should not be possible to change ownership to the same owner', function() {
			var owner = accounts[0]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, owner)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "OwnershipChange")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
			})
		})
		it('should not be possible to change ownership of missing asset', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.changeOwnership(nonAsset, nonOwner)
			}).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
				return bmcPlatform.owner.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), ADDRESS_ZERO)
			})
		})
		it('should be possible to change ownership of asset', function() {
			var owner = accounts[0]
			var newOwner = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "OwnershipChange")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), owner)
				assert.equal(events[0].args.to.valueOf(), newOwner)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), newOwner)
			})
		})
		it('should be possible to reissue after ownership change', function() {
			var owner = accounts[0]
			var newOwner = accounts[1]
			var isReissuable = true
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner)
			}).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount, { from: newOwner, })
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE + amount)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(newOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should be possible to revoke after ownership change to missing account', function() {
			var owner = accounts[0]
			var newOwner = accounts[1]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner)
			}).then(function() {
				return bmcPlatform.transfer(newOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount, { from: newOwner, })
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(newOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to revoke after ownership change to existing account', function() {
			var owner = accounts[0]
			var newOwner = accounts[1]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(newOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner)
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount, { from: newOwner, })
			}).then(function() {
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(newOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should keep ownership change separated between assets', function() {
			var owner = accounts[0]
			var newOwner = accounts[1]
			var symbol2 = bytes32(10)
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner)
			}).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), newOwner)
				return bmcPlatform.owner.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), owner)
			})
		})
		it('should not be possible to transfer missing asset', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var amount = 100
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, nonAsset)
			}).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(nonOwner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(owner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to transfer amount 1 with balance 0', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, VALUE, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to transfer amount 2 with balance 1', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var value = 1
			var amount = 2
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to transfer amount (2**256 - 1) with balance (2**256 - 2)', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var value = UINT_256_MINUS_2
			var amount = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to transfer amount 0', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var amount = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, amount, SYMBOL)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to transfer to oneself', function() {
			var owner = accounts[0]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(owner, amount, SYMBOL)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to transfer amount (2**256 - 1) to holder with 1 balance', function() {
			// Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
		})
		it('should not be possible to transfer amount 1 to holder with (2**256 - 1) balance', function() {
			// Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
		})
		it('should not be possible to transfer amount 2**255 to holder with 2**255 balance', function() {
			// Situation is impossible due to impossibility to issue more than (2**256 - 1) tokens for the asset.
		})
		it('should be possible to transfer amount 2**255 to holder with (2**255 - 1) balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var value = UINT_256_MINUS_1
			var amount = UINT_255
			var balance2 = UINT_255_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, balance2, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to transfer amount (2**255 - 1) to holder with 2**255 balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var value = UINT_256_MINUS_1
			var amount = UINT_255_MINUS_1
			var balance2 = UINT_255
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, balance2, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to transfer amount (2**256 - 2) to holder with 1 balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var value = UINT_256_MINUS_1
			var amount = UINT_256_MINUS_2
			var balance2 = 1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, balance2, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to transfer amount 1 to holder with (2**256 - 2) balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var value = UINT_256_MINUS_1
			var amount = 1
			var balance2 = UINT_256_MINUS_2
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, balance2, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to transfer amount 1 to existing holder with 0 balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, VALUE, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder, amount, SYMBOL, { from: holder2, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should be possible to transfer amount 1 to missing holder', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should be possible to transfer amount 1 to holder with non-zero balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var balance2 = 100
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, balance2, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance2 + amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - balance2 - amount)
			})
		})
		it('should be possible to transfer amount (2**256 - 1) to existing holder with 0 balance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var amount = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.transfer(holder, amount, SYMBOL, { from: holder2, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should be possible to transfer amount (2**256 - 1) to missing holder', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var amount = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, amount, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(holder2, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should keep transfers separated between assets', function() {
			var symbol = SYMBOL
			var symbol2 = bytes32(200)
			var value = 500
			var value2 = 1000
			var holder = accounts[0]
			var holder2 = accounts[1]
			var amount = 100
			var amount2 = 33
			return bmcPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.transfer(holder2, amount, symbol)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), holder2)
				assert.equal(events[0].args.symbol.valueOf(), symbol)
				assert.equal(events[0].args.value.valueOf(), amount)
				assert.equal(events[0].args.reference.valueOf(), "")
				return bmcPlatform.transfer(holder2, amount2, symbol2)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), holder2)
				assert.equal(events[0].args.symbol.valueOf(), symbol2)
				assert.equal(events[0].args.value.valueOf(), amount2)
				assert.equal(events[0].args.reference.valueOf(), "")
				return bmcPlatform.balanceOf.call(holder, symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value - amount)
				return bmcPlatform.balanceOf.call(holder2, symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(holder, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2 - amount2)
				return bmcPlatform.balanceOf.call(holder2, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount2)
			})
		})
		it('should be possible to do transfer with reference', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var reference = "Invoice#AS001"
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transferWithReference(holder2, VALUE, SYMBOL, reference)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), holder2)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				assert.equal(events[0].args.value.valueOf(), VALUE)
				assert.equal(events[0].args.reference.valueOf(), reference)
				return bmcPlatform.balanceOf.call(holder2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to reissue asset by non-owner', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, 100, { from: nonOwner, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to reissue fixed asset', function() {
			var owner = accounts[0]
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, 100)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to reissue 0 of reissuable asset', function() {
			var owner = accounts[0]
			var isReissuable = true
			var amount = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Issue")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to reissue missing asset', function() {
			var owner = accounts[0]
			var isReissuable = true
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(nonAsset, 100)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(owner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to reissue 1 with total supply (2**256 - 1)', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_1
			var isReissuable = true
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Issue")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to reissue (2**256 - 1) with total supply 1', function() {
			var owner = accounts[0]
			var value = 1
			var isReissuable = true
			var amount = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Issue")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to reissue 1 with total supply (2**256 - 2)', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_2
			var isReissuable = true
			var amount = 1
			var resultValue = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should be possible to reissue 1 with total supply 0', function() {
			var owner = accounts[0]
			var value = 0
			var isReissuable = true
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value + amount)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value + amount)
			})
		})
		it('should be possible to reissue (2**256 - 1) with total supply 0', function() {
			var owner = accounts[0]
			var value = 0
			var isReissuable = true
			var amount = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should be possible to reissue (2**256 - 2) with total supply 1', function() {
			var owner = accounts[0]
			var value = 1
			var isReissuable = true
			var amount = UINT_256_MINUS_2
			var resultValue = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should be possible to reissue (2**255 - 1) with total supply 2**255', function() {
			var owner = accounts[0]
			var value = UINT_255
			var isReissuable = true
			var amount = UINT_255_MINUS_1
			var resultValue = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should be possible to reissue 2**255 with total supply (2**255 - 1)', function() {
			var owner = accounts[0]
			var value = UINT_255_MINUS_1
			var isReissuable = true
			var amount = UINT_255
			var resultValue = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should keep reissuance separated between assets', function() {
			var symbol = SYMBOL
			var symbol2 = bytes32(200)
			var value = 500
			var value2 = 1000
			var holder = accounts[0]
			var amount = 100
			var amount2 = 33
			var isReissuable = true
			return bmcPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, isReissuable)
			}).then(function() {
				return bmcPlatform.reissueAsset(symbol, amount)
			}).then(function() {
				return bmcPlatform.reissueAsset(symbol2, amount2)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value + amount)
				return bmcPlatform.totalSupply.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value + amount)
				return bmcPlatform.balanceOf.call(holder, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2 + amount2)
				return bmcPlatform.totalSupply.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2 + amount2)
			})
		})
		it('should not be possible to revoke 1 from missing asset', function() {
			var owner = accounts[0]
			var amount = 1
			var nonAsset = 'LHNONEXIST'
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(nonAsset, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(owner, nonAsset)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to revoke 0 from fixed asset', function() {
			var owner = accounts[0]
			var amount = 0
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to revoke 0 from reissuable asset', function() {
			var owner = accounts[0]
			var amount = 0
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should not be possible to revoke 1 with balance 0', function() {
			var owner = accounts[0]
			var value = 0
			var amount = 1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to revoke 2 with balance 1', function() {
			var owner = accounts[0]
			var value = 1
			var amount = 2
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to revoke (2**256 - 1) with balance (2**256 - 2)', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_2
			var amount = UINT_256_MINUS_1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not be possible to revoke 2**255 with balance (2**255 - 1)', function() {
			var owner = accounts[0]
			var value = UINT_255_MINUS_1
			var amount = UINT_255
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to revoke by non-owner', function() {
			var owner = accounts[0]
			var nonOwner = accounts[1]
			var balance = 100
			var revokeAmount = 10
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(nonOwner, balance, SYMBOL)
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, revokeAmount, { from: nonOwner, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 1)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - balance)
				return bmcPlatform.balanceOf.call(nonOwner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance - revokeAmount)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - revokeAmount)
			})
		})
		it('should be possible to revoke 1 from fixed asset with 1 balance', function() {
			var owner = accounts[0]
			var value = 1
			var amount = 1
			var isReissuable = false
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Revoke")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				assert.equal(events[0].args.value.valueOf(), amount)
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to revoke 1 from reissuable asset with 1 balance', function() {
			var owner = accounts[0]
			var value = 1
			var amount = 1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to revoke 2**255 with 2**255 balance', function() {
			var owner = accounts[0]
			var value = UINT_255
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, value)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to revoke (2**256 - 1) with (2**256 - 1) balance', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, value)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to revoke 1 with 2 balance', function() {
			var owner = accounts[0]
			var value = 2
			var amount = 1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value - amount)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value - amount)
			})
		})
		it('should be possible to revoke 2 with (2**256 - 1) balance', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_1
			var amount = 2
			var resultValue = UINT_256_MINUS_3
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should keep revokes separated between assets', function() {
			var symbol = SYMBOL
			var symbol2 = bytes32(200)
			var value = 500
			var value2 = 1000
			var holder = accounts[0]
			var amount = 100
			var amount2 = 33
			return bmcPlatform.issueAsset(symbol, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.revokeAsset(symbol, amount)
			}).then(function() {
				return bmcPlatform.revokeAsset(symbol2, amount2)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value - amount)
				return bmcPlatform.totalSupply.call(symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value - amount)
				return bmcPlatform.balanceOf.call(holder, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2 - amount2)
				return bmcPlatform.totalSupply.call(symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2 - amount2)
			})
		})
		it('should be possible to reissue 1 after revoke 1 with total supply (2**256 - 1)', function() {
			var owner = accounts[0]
			var value = UINT_256_MINUS_1
			var amount = 1
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.totalSupply.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})

		it('should not be possible to trust to already trusted address', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.trust.call(trustee)
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ALREADY_TRUSTED)
			})
		})
		it('should not be possible to trust to oneself', function() {
			var holder = accounts[0]
			return bmcPlatform.trust.call(holder).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_CANNOT_APPLY_TO_ONESELF)
			})
		})
		it('should be possible to trust by existing holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust.call(trustee)
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.OK)
			})
		})
		it('should be possible to trust by missing holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			return bmcPlatform.trust.call(trustee).then(function(result) {
				assert.equal(result, ErrorsEnum.OK)
			})
		})
		it('should be possible to trust to multiple addresses', function() {
			var holder = accounts[0]
			var trustee1 = accounts[1]
			var trustee2 = accounts[2]
			return bmcPlatform.trust(trustee1).then(function(result) {
				return bmcPlatform.trust(trustee2)
			}).then(function() {
				return bmcPlatform.isTrusted.call(holder, trustee1)
			}).then(function(result) {
				assert.isTrue(result)
				return bmcPlatform.isTrusted.call(holder, trustee2)
			}).then(function(result) {
				assert.isTrue(result)
			})
		})

		it('should not be possible to distrust an untrusted address', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var untrustee = accounts[2]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.distrust.call(untrustee)
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should not be possible to distrust by missing holder', function() {
			var holder = accounts[0]
			var untrustee = accounts[1]
			return bmcPlatform.distrust.call(untrustee).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should not be possible to distrust oneself', function() {
			var holder = accounts[0]
			return bmcPlatform.distrust.call(holder).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should be possible to distrust a trusted address', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.distrust(trustee)
			}).then(function() {
				return bmcPlatform.isTrusted.call(holder, trustee)
			}).then(function(result) {
				assert.isFalse(result)
			})
		})
		it('should be possible to distrust a last trusted address', function() {
			var holder = accounts[0]
			var trustee1 = accounts[1]
			var trustee2 = accounts[2]
			return bmcPlatform.trust(trustee1).then(function() {
				return bmcPlatform.trust(trustee2)
			}).then(function() {
				return bmcPlatform.distrust(trustee2)
			}).then(function() {
				return bmcPlatform.isTrusted.call(holder, trustee2)
			}).then(function(result) {
				assert.isFalse(result)
				return bmcPlatform.isTrusted.call(holder, trustee1)
			}).then(function(result) {
				assert.isTrue(result)
			})
		})
		it('should be possible to distrust a not last trusted address', function() {
			var holder = accounts[0]
			var trustee1 = accounts[1]
			var trustee2 = accounts[2]
			return bmcPlatform.trust(trustee1).then(function() {
				return bmcPlatform.trust(trustee2)
			}).then(function() {
				return bmcPlatform.distrust(trustee1)
			}).then(function() {
				return bmcPlatform.isTrusted.call(holder, trustee1)
			}).then(function(result) {
				assert.isFalse(result)
				return bmcPlatform.isTrusted.call(holder, trustee2)
			}).then(function(result) {
				assert.isTrue(result)
			})
		})

		it('should not be possible to recover to existing holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.trust(accounts[3], { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.recover.call(holder, recoverTo, { from: trustee, })
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_SHOULD_RECOVER_TO_NEW_ADDRESS)
			})
		})
		it('should not be possible to recover by untrusted', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.recover.call(holder, recoverTo, { from: untrustee, })
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should not be possible to recover from missing holder', function() {
			var holder = accounts[0]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			return bmcPlatform.recover.call(holder, recoverTo, { from: untrustee, }).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should not be possible to recover by oneself', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[3]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.recover.call(holder, recoverTo, { from: holder, })
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_ACCESS_DENIED_ONLY_TRUSTED)
			})
		})
		it('should not be possible to recover to oneself', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			return bmcPlatform.trust(trustee).then(function() {
				return bmcPlatform.recover.call(holder, holder, { from: trustee, })
			}).then(function(result) {
				assert.equal(result, ErrorsEnum.BMC_PLATFORM_SHOULD_RECOVER_TO_NEW_ADDRESS)
			})
		})
		it('should not be possible to recover to the same address', function() {
			// Covered by 'should not be possible to recover to oneself'.
		})
		it('should not be possible to do transfer by target after failed recovery', function() {
			var holder = accounts[0]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: untrustee, })
			}).then(function() {
				return bmcPlatform.transfer(untrustee, 100, SYMBOL, { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(untrustee, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to do transfer by holder after failed recovery', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: untrustee, })
			}).then(function() {
				return bmcPlatform.transfer(untrustee, amount, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(untrustee, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should be possible to recover', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Recovery")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), recoverTo)
				assert.equal(events[0].args.by.valueOf(), trustee)
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to recover multiple times', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			var recoverTo2 = accounts[3]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.recover(recoverTo, recoverTo2, { from: trustee, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to recover recovered address', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			var recoverTo2 = accounts[3]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo2, { from: trustee, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Recovery")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), recoverTo)
				assert.equal(events[0].args.to.valueOf(), recoverTo2)
				assert.equal(events[0].args.by.valueOf(), trustee)
				return bmcPlatform.balanceOf.call(recoverTo2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to do transfers after recovery by holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.transfer(untrustee, amount, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(untrustee, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should be possible to reissue after recovery', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[3]
			var amount = 100
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount, { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE + amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE + amount)
			})
		})
		it('should be possible to revoke after recovery', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[3]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount, { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should be possible to change ownership after recovery', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var newOwner = accounts[2]
			var recoverTo = accounts[3]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner, { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), newOwner)
				return bmcPlatform.isOwner.call(holder, SYMBOL)
			}).then(function(result) {
				assert.isFalse(result.valueOf())
				return bmcPlatform.isOwner.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.isFalse(result.valueOf())
			})
		})
		it('should be possible to reissue after recovery by holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[3]
			var amount = 100
			var isReissuable = true
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, isReissuable).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.reissueAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE + amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE + amount)
			})
		})
		it('should be possible to revoke after recovery by holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[3]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.revokeAsset(SYMBOL, amount)
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should be possible to change ownership after recovery by holder', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var newOwner = accounts[2]
			var recoverTo = accounts[3]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.changeOwnership(SYMBOL, newOwner, { from: holder, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "OwnershipChange")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), recoverTo)
				assert.equal(events[0].args.to.valueOf(), newOwner)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), newOwner)
				return bmcPlatform.isOwner.call(holder, SYMBOL)
			}).then(function(result) {
				assert.isFalse(result.valueOf())
				return bmcPlatform.isOwner.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.isFalse(result.valueOf())
			})
		})
		it('should be possible to do transfers after recovery by recovered address', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var untrustee = accounts[2]
			var recoverTo = accounts[3]
			var amount = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.transfer(untrustee, amount, SYMBOL, { from: recoverTo, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(untrustee, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
				return bmcPlatform.balanceOf.call(recoverTo, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
			})
		})
		it('should recover asset ownership', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.owner.call(SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), recoverTo)
			})
		})
		it('should recover balances', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			var symbol1 = bytes32(31)
			var symbol2 = bytes32(32)
			var value1 = 100
			var value2 = 200
			return bmcPlatform.issueAsset(symbol1, value1, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(recoverTo, symbol1)
			}).then(function(result) {
				assert.equal(result.valueOf(), value1)
				return bmcPlatform.balanceOf.call(recoverTo, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
			})
		})
		it('should recover allowances', function() {
			var holder = accounts[0]
			var trustee = accounts[1]
			var recoverTo = accounts[2]
			var symbol1 = bytes32(31)
			var symbol2 = bytes32(32)
			var spender1 = accounts[3]
			var spender2 = accounts[4]
			var value1 = 100
			var value2 = 200
			return bmcPlatform.issueAsset(symbol1, value1, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, value2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.approve(spender1, value1, symbol1)
			}).then(function() {
				return bmcPlatform.approve(spender2, value2, symbol2)
			}).then(function() {
				return bmcPlatform.trust(trustee)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee, })
			}).then(function() {
				return bmcPlatform.allowance.call(recoverTo, spender1, symbol1)
			}).then(function(result) {
				assert.equal(result.valueOf(), value1)
				return bmcPlatform.allowance.call(recoverTo, spender2, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
			})
		})
		it('should recover trusts', function() {
			var holder = accounts[0]
			var trustee1 = accounts[1]
			var trustee2 = accounts[2]
			var recoverTo = accounts[3]
			var untrustee = accounts[5]
			return bmcPlatform.trust(trustee1).then(function() {
				return bmcPlatform.trust(trustee2)
			}).then(function() {
				return bmcPlatform.recover(holder, recoverTo, { from: trustee1, })
			}).then(function() {
				return bmcPlatform.isTrusted.call(recoverTo, trustee1)
			}).then(function(result) {
				assert.isTrue(result)
				return bmcPlatform.isTrusted.call(recoverTo, trustee2)
			}).then(function(result) {
				assert.isTrue(result)
				return bmcPlatform.isTrusted.call(recoverTo, untrustee)
			}).then(function(result) {
				assert.isFalse(result)
			})
		})

		it('should not be possible to set allowance for missing symbol', function() {
			var owner = accounts[0]
			var spender = accounts[1]
			var missingSymbol = bytes32(33)
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 100, missingSymbol)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Approve")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.allowance.call(owner, spender, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to set allowance for missing symbol for oneself', function() {
			var owner = accounts[0]
			var missingSymbol = bytes32(33)
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(owner, 100, missingSymbol)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Approve")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.allowance.call(owner, owner, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to set allowance for oneself', function() {
			var owner = accounts[0]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(owner, 100, SYMBOL)
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Approve")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.allowance.call(owner, owner, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to set allowance from missing holder to missing holder', function() {
			var holder = accounts[1]
			var spender = accounts[2]
			var value = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL, { from: holder, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Approve")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.spender.valueOf(), spender)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				assert.equal(events[0].args.value.valueOf(), value)
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance from missing holder to existing holder', function() {
			var holder = accounts[1]
			var spender = accounts[0]
			var value = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance from existing holder to missing holder', function() {
			var holder = accounts[0]
			var spender = accounts[2]
			var value = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance from existing holder to existing holder', function() {
			var holder = accounts[0]
			var spender = accounts[2]
			var value = 100
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, 1, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL, { from: holder, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance value 0', function() {
			// Covered by 'should be possible to override allowance value with 0 value'.
		})
		it('should be possible to set allowance with (2**256 - 1) value', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance value less then balance', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance value equal to balance', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = VALUE
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to set allowance value more then balance', function() {
			// Covered by 'should be possible to set allowance with (2**256 - 1) value'.
		})
		it('should be possible to override allowance value with 0 value', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to override allowance value with non 0 value', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 1000
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should not affect balance when setting allowance', function() {
			var holder = accounts[0]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(accounts[1], 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to set allowance', function() {
			// Covered by other tests above.
		})

		it('should not be possible to do allowance transfer by not allowed existing spender, from existing holder', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 100
			var expectedSpenderBalance = 100
			var expectedHolderBalance = VALUE - value
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, 50, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
			})
		})
		it('should not be possible to do allowance transfer by not allowed existing spender, from missing holder', function() {
			var holder = accounts[2]
			var spender = accounts[1]
			var value = 100
			var expectedSpenderBalance = 100
			var expectedHolderBalance = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, 50, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
			})
		})
		it('should not be possible to do allowance transfer by not allowed missing spender, from existing holder', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var expectedSpenderBalance = 0
			var expectedHolderBalance = VALUE
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transferFrom(holder, spender, 50, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
			})
		})
		it('should not be possible to do allowance transfer by not allowed missing spender, from missing holder', function() {
			var holder = accounts[2]
			var spender = accounts[1]
			var expectedSpenderBalance = 0
			var expectedHolderBalance = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transferFrom(holder, spender, 50, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
			})
		})
		it('should not be possible to do allowance transfer from and to the same holder', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 50, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, holder, 50, SYMBOL, { from: spender, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
			})
		})
		it('should be possible to do allowance transfer from oneself', function() {
			var holder = accounts[0]
			var receiver = accounts[1]
			var amount = 50
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transferFrom(holder, receiver, amount, SYMBOL)
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE - amount)
				return bmcPlatform.balanceOf.call(receiver, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), amount)
			})
		})
		it('should not be possible to do allowance transfer with 0 value', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 0
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 0)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), VALUE)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should not be possible to do allowance transfer with value less than balance, more than allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 1000
			var value = 999
			var allowed = 998
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should not be possible to do allowance transfer with value equal to balance, more than allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 1000
			var value = 1000
			var allowed = 999
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should not be possible to do allowance transfer with value more than balance, less than allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 199
			var value = 200
			var allowed = 201
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should not be possible to do allowance transfer with value less than balance, more than allowed after another tranfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 102
			var anotherValue = 10
			var value = 91
			var allowed = 100
			var expectedHolderBalance = balance - anotherValue
			var resultValue = anotherValue
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, anotherValue, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should not be possible to do allowance transfer with missing symbol when allowed for another symbol', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 1000
			var value = 200
			var allowed = 1000
			var missingSymbol = bytes32(33)
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, missingSymbol, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.balanceOf.call(holder, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(spender, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to do allowance transfer when allowed for another symbol', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 1000
			var value = 200
			var allowed = 1000
			var symbol2 = bytes32(2)
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, symbol2, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.balanceOf.call(holder, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should not be possible to do allowance transfer with missing symbol when not allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 1000
			var value = 200
			var missingSymbol = bytes32(33)
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, missingSymbol, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), balance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
				return bmcPlatform.balanceOf.call(holder, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(spender, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should be possible to do allowance transfer by allowed existing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var existValue = 100
			var value = 300
			var expectedHolderBalance = VALUE - existValue - value
			var expectedSpenderBalance = existValue + value
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, existValue, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
			})
		})
		it('should be possible to do allowance transfer by allowed missing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 300
			var expectedHolderBalance = VALUE - value
			var expectedSpenderBalance = value
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
			})
		})
		it('should be possible to do allowance transfer to oneself', function() {
			// Covered by 'should be possible to do allowance transfer by allowed existing spender'.
		})
		it('should be possible to do allowance transfer to existing holder', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var receiver = accounts[2]
			var existValue = 100
			var value = 300
			var expectedHolderBalance = VALUE - existValue - value
			var expectedReceiverBalance = existValue + value
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(receiver, existValue, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, receiver, value, SYMBOL, { from: spender, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), receiver)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				assert.equal(events[0].args.value.valueOf(), value)
				assert.equal(events[0].args.reference.valueOf(), "")
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(receiver, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedReceiverBalance)
			})
		})
		it('should be possible to do allowance transfer to missing holder', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var receiver = accounts[2]
			var value = 300
			var expectedHolderBalance = VALUE - value
			var expectedReceiverBalance = value
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, receiver, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(receiver, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedReceiverBalance)
			})
		})
		it('should be possible to do allowance transfer with value less than balance and less than allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 201
			var value = 200
			var allowed = 201
			var expectedHolderBalance = balance - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to do allowance transfer with value less than balance and equal to allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 201
			var value = 200
			var allowed = 200
			var expectedHolderBalance = balance - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to do allowance transfer with value equal to balance and less than allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 200
			var value = 200
			var allowed = 201
			var expectedHolderBalance = balance - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to do allowance transfer with value equal to balance and equal to allowed', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 200
			var value = 200
			var allowed = 200
			var expectedHolderBalance = balance - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to do allowance transfer with value less than balance and less than allowed after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 201
			var anotherValue = 1
			var value = 199
			var allowed = 201
			var expectedSpenderBalance = anotherValue + value
			var expectedHolderBalance = balance - anotherValue - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, anotherValue, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
			})
		})
		it('should be possible to do allowance transfer with value less than balance and equal to allowed after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var balance = 201
			var anotherValue = 1
			var value = 199
			var allowed = 200
			var expectedSpenderBalance = anotherValue + value
			var expectedHolderBalance = balance - anotherValue - value
			return bmcPlatform.issueAsset(SYMBOL, balance, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, allowed, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, anotherValue, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedSpenderBalance)
			})
		})
		it('should be possible to do allowance transfer with value (2**256 - 1)', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = UINT_256_MINUS_1
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
				return bmcPlatform.balanceOf.call(spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to do allowance transfer with reference', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var receiver = accounts[2]
			var value = 300
			var expectedHolderBalance = VALUE - value
			var expectedReceiverBalance = value
			var reference = "just some arbitrary string."
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFromWithReference(holder, receiver, value, SYMBOL, reference, { from: spender, })
			}).then(function(txHash) {
				return eventsHelper.extractEvents(txHash, "Transfer")
			}).then(function(events) {
				assert.equal(events.length, 1)
				assert.equal(events[0].args.from.valueOf(), holder)
				assert.equal(events[0].args.to.valueOf(), receiver)
				assert.equal(events[0].args.symbol.valueOf(), SYMBOL)
				assert.equal(events[0].args.value.valueOf(), value)
				assert.equal(events[0].args.reference.valueOf(), reference)
				return bmcPlatform.balanceOf.call(holder, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedHolderBalance)
				return bmcPlatform.balanceOf.call(receiver, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), expectedReceiverBalance)
			})
		})

		it('should return 0 allowance for existing owner and not allowed existing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for existing owner and not allowed missing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for missing owner and existing spender', function() {
			var holder = accounts[1]
			var spender = accounts[0]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for missing owner and missing spender', function() {
			var holder = accounts[1]
			var spender = accounts[2]
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for existing oneself', function() {
			var holder = accounts[0]
			var spender = holder
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for missing oneself', function() {
			var holder = accounts[1]
			var spender = holder
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should return 0 allowance for missing symbol', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var missingSymbol = bytes32(33)
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, missingSymbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), 0)
			})
		})
		it('should respect symbol when telling allowance', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var symbol = SYMBOL
			var symbol2 = bytes32(2)
			var value = 100
			var value2 = 200
			return bmcPlatform.issueAsset(symbol, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.issueAsset(symbol2, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE)
			}).then(function() {
				return bmcPlatform.approve(spender, value, symbol)
			}).then(function() {
				return bmcPlatform.approve(spender, value2, symbol2)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, symbol)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.allowance.call(holder, spender, symbol2)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
			})
		})
		it('should respect holder when telling allowance', function() {
			var holder = accounts[0]
			var holder2 = accounts[1]
			var spender = accounts[2]
			var value = 100
			var value2 = 200
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value2, SYMBOL, { from: holder2, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.allowance.call(holder2, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
			})
		})
		it('should respect spender when telling allowance', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var spender2 = accounts[2]
			var value = 100
			var value2 = 200
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender2, value2, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
				return bmcPlatform.allowance.call(holder, spender2, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value2)
			})
		})
		it('should be possible to check allowance of existing owner and allowed existing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 300
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.transfer(spender, 100, SYMBOL)
			}).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should be possible to check allowance of existing owner and allowed missing spender', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 300
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), value)
			})
		})
		it('should return 0 allowance after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = 300
			var resultValue = 0
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, value, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should return 1 allowance after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var receiver = accounts[2]
			var value = 300
			var transfer = 299
			var resultValue = 1
			return bmcPlatform.issueAsset(SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, receiver, transfer, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should return 2**255 allowance after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = UINT_256_MINUS_1
			var transfer = UINT_255_MINUS_1
			var resultValue = UINT_255
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, transfer, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
		it('should return (2**256 - 2) allowance after another transfer', function() {
			var holder = accounts[0]
			var spender = accounts[1]
			var value = UINT_256_MINUS_1
			var transfer = 1
			var resultValue = UINT_256_MINUS_2
			return bmcPlatform.issueAsset(SYMBOL, value, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE).then(function() {
				return bmcPlatform.approve(spender, value, SYMBOL)
			}).then(function() {
				return bmcPlatform.transferFrom(holder, spender, transfer, SYMBOL, { from: spender, })
			}).then(function() {
				return bmcPlatform.allowance.call(holder, spender, SYMBOL)
			}).then(function(result) {
				assert.equal(result.valueOf(), resultValue)
			})
		})
	})

})
