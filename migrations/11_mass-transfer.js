var csv = require("csv-parse/lib/sync");
var Q = require("q");
var fs = require("fs");
var eventsHelper = require('../test/helpers/eventsHelper');

var BMCPlatform = artifacts.require("./BMCPlatform.sol");


module.exports = function(deployer,network) {
    const ASSET_SYMBOL = "BMC";
    const DATA_FILE_PATH = "./migrations/data.csv";
    const BATCH_SIZE = 20;

    var rawData = fs.readFileSync(DATA_FILE_PATH).toString('utf-8');
    var data = csv(rawData, {columns: true});

    var chain = Q.when();

    let transfers = [];
    for (let row of data) {
        transfers.push({address: web3.toHex(row.address), amount: web3.toBigNumber(row.amount)});
    }

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
                      console.log("Transfer to:", addresses.length, "addresses");

                      return platform.massTransfer(addresses, amounts, ASSET_SYMBOL);
                  })
                  .then(tx => massTransferTx = tx)
                  .then(() => eventsHelper.extractEvents(massTransferTx, "Transfer"))
                  .then((transferEvents) => {
                        for (let transferEvent of transferEvents) {
                            let args = transferEvent.args;
                            console.log("Transfered:", args.from, ",", args.to, ",", web3.toAscii(args.symbol), ",", args.value.toNumber());
                        }

                        batchTransferedCount = transferEvents.length;
                  })
                  .then(() => eventsHelper.extractEvents(massTransferTx, "Error"))
                  .then(errors => {
                        for (let error of errors) {
                            console.error("Error:",web3.toAscii(error.args.message), "Aborted.");
                        }

                        batchFailed = errors.length > 0;
                  })
                  .then(() => {
                    if (batchFailed) {
                        throw "An error occurred. See logs. Aborted.";
                    } else {
                        transfers.splice(0, batchTransferedCount);
                        return transfers;
                    }
                  })
        }

        return Q.all(chain);
    }

    deployer
        .then(() => BMCPlatform.deployed())
        .then(_platform => platform = _platform)
        .then(() => _massTransfer(platform, transfers))
        // .then(() => platform.balanceOf.call(0x11, ASSET_SYMBOL))
        // .then(r => console.log(r))
}
