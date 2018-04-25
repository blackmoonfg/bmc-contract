var csv = require("csv-parse/lib/sync")
var Q = require("q")
var fs = require("fs")
var eventsHelper = require('../common/helpers/eventsHelper')
var createCsvWriter = require('csv-writer').createObjectCsvWriter

var BMCPlatform = artifacts.require("./BMCPlatform.sol")

const NOT_TRANSFERED = 0
const TRANSFERED = 1

module.exports = function(deployer) {
	const ASSET_SYMBOL = "BMC" // TODO: change me
	const DATA_FILE_PATH = "./migrations/data.csv"
	const BATCH_SIZE = 50

	var rawData = fs.readFileSync(DATA_FILE_PATH).toString('utf-8')
	var data = csv(rawData, { columns: true, })

	if (data.length === 0) {
		throw "Data file is empty or incorrect csv format. Aborted"
	}

	const transfers = []
	for (const row of data) {
		if (row.status === NOT_TRANSFERED) {
			transfers.push({ address: web3.toHex(row.address), amount: web3.toBigNumber(row.amount), })
		}
	}

	const toBeTransferedCount = transfers.length
	let transferedCount = 0

	const _massTransfer = (platform, transfers) => {
		var chain = Q.when(transfers)

		// 1 Transfer takes ~110 000 gas
		for (var i = 0; i < transfers.length / BATCH_SIZE; i++) {
			chain = chain
				.then(_transfers => _transfers.slice(0, BATCH_SIZE))
				.then(_toExecute => {
					var addresses = []
					var amounts = []

					for (const _itemToExecute of _toExecute) {
						addresses.push(_itemToExecute.address)
						amounts.push(_itemToExecute.amount)
					}

					return platform.massTransfer(addresses, amounts, ASSET_SYMBOL)
				})
				.then(tx => massTransferTx = tx)
				.then(() => eventsHelper.extractEvents(massTransferTx, "Transfer"))
				.then(transferEvents => {
					for (const transferEvent of transferEvents) {
						const args = transferEvent.args
						console.log("[MASS TRANSFER] Transfered:", args.from, ",", args.to, ",", web3.toAscii(args.symbol), ",", args.value.toNumber())

						try {
							updateTransferInfo(args.to, TRANSFERED, data)
							transferedCount++
						}
						catch (error) {
							console.error("[MASS TRANSFER] [ERROR]", error)
						}
					}
				})
				.then(() => eventsHelper.extractEvents(massTransferTx, "Error"))
				.then(errors => {
					for (const error of errors) {
						console.error("[MASS TRANSFER] [Error]", web3.toAscii(error.args.message))
					}
				})
				.then(() => dumpTransferInfo(DATA_FILE_PATH, data))
				.then(() => {
					transfers.splice(0, BATCH_SIZE)
					return transfers
				})
		}

		return chain
	}

	deployer
		.then(() => BMCPlatform.deployed())
		.then(_platform => platform = _platform)
		.then(() => _massTransfer(platform, transfers).catch(_error => console.error("[MASS TRANSFER] [ERROR]", _error)))
		.catch(_error => console.error("[MASS TRANSFER] [ERROR]", _error))
		.then(() => console.log("[MASS TRANSFER] Done. Transfered to", transferedCount, "account(s)"))
		.then(() => {
			if (transferedCount !== toBeTransferedCount) {
				throw (toBeTransferedCount - transferedCount) + " transfer(s) are failed. Check logs."
			}
		}
		)
}

const updateTransferInfo = (key, value, transfers) => {
	var updated = false
	for (const transfer of transfers) {
		if (transfer.address === key) {
			transfer.status = TRANSFERED
			updated = true
			break
		}
	}

	if (!updated) {
		throw "Unable update status for " + key
	}
}

const dumpTransferInfo = (filePath, transfers) => {
	console.log("[MASS TRANSFER] Updating data file...")
	const ledger = createCsvWriter({
		path: filePath,
		header: [
			{ id: 'address', title: 'address', },
			{ id: 'amount', title: 'amount', },
			{ id: 'status', title: 'status', },
		],
	})

	return ledger.writeRecords(transfers)
}
