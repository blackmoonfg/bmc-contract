var bs58 = require('bs58');

function bytes32fromBase58(stringOrNumber) {
  return `0x${new Buffer(bs58.decode(stringOrNumber)).toString('hex').substr(4)}`
}

module.exports = bytes32fromBase58;