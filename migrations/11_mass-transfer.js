var csv = require("csv-parse/lib/sync");
var Q = require("q");
var fs = require("fs");
var eventsHelper = require('../test/helpers/eventsHelper');
var createCsvWriter = require('csv-writer').createObjectCsvWriter

var BMCPlatform = artifacts.require("./BMCPlatform.sol");

const NOT_TRANSFERED = 0;
const TRANSFERED = 1;

module.exports = function(deployer,network) {
    const ASSET_SYMBOL = "BMC"; // TODO: change me
    const DATA_FILE_PATH = "./migrations/data.csv";
    const BATCH_SIZE = 20;

    var rawData = fs.readFileSync(DATA_FILE_PATH).toString('utf-8');
    var data = csv(rawData, {columns: true});

    if (data.length == 0) {
        throw "Data file is empty or incorrect csv format. Aborted";
    }

    let transfers = [];
    for (let row of data) {
        if (row.status == NOT_TRANSFERED) {
            transfers.push({address: web3.toHex(row.address), amount: web3.toBigNumber(row.amount)});
        }
    }

    let toBeTransferedCount = transfers.length;
    let transferedCount = 0;

    let _massTransfer = (platform, transfers) => {
        var chain = Q.when(transfers);

        // 1 Transfer takes ~110 000 gas
        for(var i = 0; i < transfers.length / BATCH_SIZE; i++) {
            chain = chain
                  .then(_transfers => _transfers.slice(0, BATCH_SIZE))
                  .then(_toExecute => {
                      var addresses = [];
                      var amounts = [];

                      for (let _itemToExecute of _toExecute) {
                          addresses.push(_itemToExecute.address);
                          amounts.push(_itemToExecute.amount);
                      }

                      return platform.massTransfer(addresses, amounts, ASSET_SYMBOL);
                  })
                  .then(tx => massTransferTx = tx)
                  .then(() => eventsHelper.extractEvents(massTransferTx, "Transfer"))
                  .then((transferEvents) => {
                        for (let transferEvent of transferEvents) {
                            let args = transferEvent.args;
                            console.log("[MASS TRANSFER] Transfered:", args.from, ",", args.to, ",", web3.toAscii(args.symbol), ",", args.value.toNumber());

                            try {
                                updateTransferInfo(args.to, TRANSFERED, data);
                                transferedCount++;
                            } catch(error) {
                                console.error("[MASS TRANSFER] [ERROR]", error);
                            }
                        }
                  })
                  .then(() => eventsHelper.extractEvents(massTransferTx, "Error"))
                  .then(errors => {
                        for (let error of errors) {
                            console.error("[MASS TRANSFER] [Error]",web3.toAscii(error.args.message));
                        }
                  })
                  .then(() => dumpTransferInfo(DATA_FILE_PATH, data))
                  .then(() => {
                       transfers.splice(0, BATCH_SIZE);
                       return transfers;
                  })
        }

        return chain;
    }

    deployer
        .then(() => BMCPlatform.deployed())
        .then(_platform => platform = _platform)
        .then(() => _massTransfer(platform, transfers).catch(_error => console.error("[MASS TRANSFER] [ERROR]", _error)))
        .catch(_error => console.error("[MASS TRANSFER] [ERROR]", _error))
        .then(() => console.log("[MASS TRANSFER] Done. Transfered to", transferedCount, "account(s)"))
        .then(() => {
            if (transferedCount != toBeTransferedCount)
                throw (toBeTransferedCount - transferedCount) + " transfer(s) are failed. Check logs.";
            }
        )
}

let updateTransferInfo = (key, value, transfers) => {
    var updated = false;
    for (let transfer of transfers) {
        if (transfer.address == key) {
            transfer.status = TRANSFERED;
            updated = true;
            break;
        }
    }

    if (!updated) {
        throw "Unable update status for " + key;
    }
}

let dumpTransferInfo = (filePath, transfers) => {
    console.log("[MASS TRANSFER] Updating data file...");
    const ledger = createCsvWriter({
        path: filePath,
        header: [
            {id: 'address', title: 'address'},
            {id: 'amount', title: 'amount'},
            {id: 'status', title: 'status'},
        ]
    });

    return ledger.writeRecords(transfers);
}
