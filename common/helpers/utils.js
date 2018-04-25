/* global assert */

const ensureException = error => {
	const strError = error.toString()
	assert(strError.includes('invalid opcode') || strError.includes('invalid JUMP'), strError)
}

const ensureRevert = error => {
	const strError = error.toString()
	assert(strError.includes('revert'), strError)
}

const getAddress = source => {
	if (typeof source === 'undefined') {
		throw new Error('source is missing')
	}
	else if (typeof source === 'string' || source instanceof String) {
		return source
	}
	else if (typeof source.address === 'undefined') {
		throw new Error('address property is missing')
	}
	return source.address
}

const toUtf8String = function (str) {
	return web3.toAscii(str).replace(/^\0+/, '').replace(/\0+$/, '')
}

const getSignature = async function (data) {
	const startBiteIndex = 0
	const endBiteIndex = 10

	return (await data).slice(startBiteIndex, endBiteIndex)
}

const getAccountsPromise = () => {
	return new Promise((resolve, reject) => web3.eth.getAccounts((err, acc) => {
		if (err) {
			reject(err)
			return
		}
		resolve(acc)
	}))
}

const zeroAddress = '0x0000000000000000000000000000000000000000'

module.exports = {
	zeroAddress: zeroAddress,
	ensureException: ensureException,
	ensureRevert: ensureRevert,
	getAddress: getAddress,
	toUtf8String: toUtf8String,
	getSignature: getSignature,
	getAccountsPromise: getAccountsPromise,
}
