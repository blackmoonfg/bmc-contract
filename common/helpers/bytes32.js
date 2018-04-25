function bytes32(stringOrNumber) {
	const zeros = '000000000000000000000000000000000000000000000000000000000000000'
	if (typeof stringOrNumber === "string") {
		return (web3.toHex(stringOrNumber) + zeros).substr(0, 66)
	}
	const hexNumber = stringOrNumber.toString(16)
	return '0x' + (zeros + hexNumber).substring(hexNumber.length - 1)
}

module.exports = bytes32
