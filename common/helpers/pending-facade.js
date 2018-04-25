const eventsHelper = require('./eventsHelper')
const utils = require('./utils')

function PendingFacade(pendingManager, web3Instance) {

	const self = this
	self.zeroBlock = 0
	self.web3 = web3Instance === null ? web3 : web3Instance

	const eventTypeSecure = "ProtectionTxAdded"
	const eventTypePolicy = "PolicyRuleAdded"

	this.getBlockNumber = async txHash => {
		const events = await eventsHelper.findEvent([pendingManager,], txHash, eventTypeSecure)
		return events[0].args.blockNumber
	}

	this.getSig = async txHash => {
		const events = await eventsHelper.findEvent([pendingManager,], txHash, eventTypePolicy)
		return events[0].args.sig
	}

	this.getKey = async txHash => {
		const events = await eventsHelper.findEvent([pendingManager,], txHash, eventTypeSecure)
		return events[0].args.key
	}

	this.accept = async (account, group, txHash) => {
		await pendingManager.accept(await self.getKey(txHash), group, { from: account, })
		return await self.getBlockNumber(txHash)
	}

	this.acceptTx = async (account, group, tx) => {
		let block = self.zeroBlock
		const txHash = await tx(block)
		block = await self.accept(account, group, txHash)
		await tx(block)
	}

	this.addPolicyRule = async (contract, tx, group, limit) => {
		await this.addExpandedPolicyRule(contract, tx, group, limit, limit)
	}

	this.addExpandedPolicyRule = async (contract, tx, group, acceptLimit, declineLimit) => {
		const sig = await utils.getSignature(tx)
		const addr = utils.getAddress(contract)
		await pendingManager.addPolicyRule(sig, addr, group, acceptLimit, declineLimit)
	}
}

module.exports = PendingFacade