var snapshotId

function Reverter(web3) {

	const self = this

	this.revert = (done, back) => {
		back = back || 0

		web3.currentProvider.sendAsync({
			jsonrpc: "2.0",
			method: "evm_revert",
			id: new Date().getTime(),
			params: [Math.max(snapshotId - back, 1),],
		}, err => {
			if (err) {
				done(err)
			}
			else {
				this.snapshot(done)
			}
		})
	}

	this.snapshot = done => {
		web3.currentProvider.sendAsync({
			jsonrpc: "2.0",
			method: "evm_snapshot",
			id: new Date().getTime(),
		}, (err, result) => {
			if (err) {
				done(err)
			}
			else {
				snapshotId = web3.toDecimal(result.result)
				done()
			}
		})
	}

	this.revertPromise = num => new Promise((resolve, reject) => self.revert((err, result) => {
		if (err) {
			reject(err)
		}
		resolve(result)
	}, num))

	this.snapshotPromise = () => new Promise((resolve, reject) => self.snapshot((err, result) => {
		if (err) {
			reject(err)
		}
		resolve(result)
	}))
}

module.exports = Reverter
