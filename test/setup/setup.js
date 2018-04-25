const Reverter = require('../../common/helpers/reverter')
const TimeMachine = require('../../common/helpers/timemachine')
const PendingFacade = require('../../common/helpers/pending-facade')

const MultiEventsHistory = artifacts.require('./MultiEventsHistory.sol')
const BMCPlatform = artifacts.require('./BMCPlatform.sol')
const BMCProxy = artifacts.require('./BMCAssetProxy.sol')
const BMCAsset = artifacts.require('./BMC.sol')

const ATxPlatform = artifacts.require('./ATxPlatform.sol')
const ATxPlatformServiceAllowanceTestable = artifacts.require('./ATxPlatformServiceAllowanceTestable.sol')

const PendingManager = artifacts.require("./PendingManager.sol")
const Withdrawal = artifacts.require('./NonOperationalWithdrawManager.sol')
const GroupsAccessManager = artifacts.require('./GroupsAccessManager.sol')

const reverter = new Reverter(web3)
const timeMachine = new TimeMachine(web3)

module.exports = Setup

module.exports.revert = () => new Promise((resolve, reject) => reverter.revert((err, result) => {
	if (err) {
		reject(err)
		return
	}
	resolve(result)
}))

module.exports.snapshot = () => new Promise((resolve, reject) => reverter.snapshot((err, result) => {
	if (err) {
		reject(err)
		return
	}
	resolve(result)
}))


function Setup(needLog, atxPlatformType) {

	const self = this

	self.def = {}
	self.web3 = web3
	self.reverter = reverter
	self.timeMachine = timeMachine

	const testGroup = web3.sha3("testGroup")

	this.init = () => {
		afterEach('revert', reverter.revert)
	}

	this.revert = () => new Promise((resolve, reject) => reverter.revert((err, result) => {
		if (err) {
			reject(err)
		}
		resolve(result)
	}))

	this.snapshot = () => new Promise((resolve, reject) => reverter.snapshot((err, result) => {
		if (err) {
			reject(err)
		}
		resolve(result)
	}))

	this.beforeAll = async () => {
		try {
			await initAccounts()
			await initFields()
			await initState()
		}
		catch (e) {
			console.log("Error:", e)
			await self.revert()
			throw e
		}
	}

	async function initFields() {

		LOG('Instantiate the deployed contracts.')

		self.def.BMCPlatform = await BMCPlatform.deployed()
		self.def.BMCAsset = await BMCAsset.deployed()
		self.def.BMCProxy = await BMCProxy.deployed()
		self.def.MultiEventsHistory = await MultiEventsHistory.deployed()

		switch (atxPlatformType) {
		case 'ATxPlatformServiceAllowanceTestable' :
			self.def.ATxPlatform = await ATxPlatformServiceAllowanceTestable.deployed()

			await self.def.MultiEventsHistory.authorize(self.def.ATxPlatform.address)
			await self.def.ATxPlatform.setupEventsHistory(self.def.MultiEventsHistory.address)

			break
		default:
			self.def.ATxPlatform = await ATxPlatform.deployed()
			break
		}

		self.def.Withdrawal = await Withdrawal.deployed()

		self.def.GroupsAccessManager = await GroupsAccessManager.new({ from: self.accounts[ 0 ], })
		self.def.PendingManager = await PendingManager.new(self.def.GroupsAccessManager.address, { from: self.accounts[ 0 ], })

		self.def.PendingFacade = new PendingFacade(self.def.PendingManager, self.web3)
		await self.def.GroupsAccessManager.createGroup(testGroup, 1)
		await self.def.GroupsAccessManager.registerUser(self.accounts[ 0 ])
		await self.def.GroupsAccessManager.addUsersToGroup(testGroup, [self.accounts[ 0 ],])
		self.token = [ createToken(1), createToken(2), ]

		self.def.TestPendingManager = await PendingManager.new(self.def.GroupsAccessManager.address, { from: self.accounts[ 0 ], })
	}

	async function initState() {

		LOG("Instantiate contract's state.")

		await initContext(self.token[ 0 ])
		await initContext(self.token[ 1 ])
		initDefValues()
	}

	function initDefValues() {

		LOG('Instantiate def values')

		const defToken = self.token[ 0 ]
		self.defToken = defToken
		self.BMCPlatform = self.def.BMCPlatform
		self.BMCAsset = self.def.BMCAsset
		self.BMCProxy = self.def.BMCProxy
		self.MultiEventsHistory = self.def.MultiEventsHistory

		self.ATxPlatform = self.def.ATxPlatform

		self.Withdrawal = defToken.Withdrawal

		self.GroupsAccessManager = self.def.GroupsAccessManager
		self.PendingManager = self.def.PendingManager

		self.TestPendingManager = self.def.TestPendingManager
	}

	async function initContext(token) {

		LOG([ 'Instantiate context for token : ', token.symbol, ])

		LOG('Platform - Asset - Proxy')
		await self.def.ATxPlatform.issueAsset(token.symbol, token.value, token.name, token.description, token.baseUnit, token.isReissuable)
		await self.def.ATxPlatform.massTransfer([ self.accounts[ 1 ], self.accounts[ 2 ], self.accounts[ 3 ], self.accounts[ 4 ], ], token.amounts, token.symbol)

		await self.def.PendingManager.signIn(self.owner)
		await self.def.TestPendingManager.signIn(self.owner)

		LOG('Non Operational Manager')
		token.Withdrawal = await Withdrawal.new(self.def.PendingManager.address)
		await self.def.PendingManager.signIn(token.Withdrawal.address)
	}

	function createToken(number) {

		LOG([ 'Create context for ', number, ])
		const symbol = "T" + number
		const name = "TOKEN" + number
		const description = "TOKEN" + number
		const reissuable = true
		const value = 10000 * number
		const decimal = 2

		const amounts = [ 5000 * number, 2500 * number, 1200 * number, 600 * number, ]


		return new Context(symbol, value, name, description, decimal, reissuable, amounts)
	}

	async function initAccounts() {

		LOG('Instantiate accounts')

		self.accounts = await new Promise((resolve, reject) =>
			web3.eth.getAccounts((err, acc) => {
				if (err) {
					reject(err)
				}
				resolve(acc)
			}))

		self.owner = self.accounts[ 0 ]
	}

	function LOG(messege) {
		if (needLog) {
			console.log(messege)
		}
	}
}

function Context(symbol, value, name, description, baseUnit, isReissuable, amounts) {
	this.symbol = symbol
	this.value = value
	this.name = name
	this.description = description
	this.baseUnit = baseUnit
	this.isReissuable = isReissuable
	this.amounts = amounts
}
