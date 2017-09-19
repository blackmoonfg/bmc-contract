const DelayedPayments = artifacts.require("./DelayedPayments.sol");
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");

module.exports = function(deployer,network) {
      deployer.deploy(DelayedPayments,0,10,10)
          .then(() => MultiEventsHistory.deployed())
          .then(_history => history = _history )
          .then(() => DelayedPayments.deployed())
          .then(_delayedPayments => delayedPayments = _delayedPayments)
          .then(() => history.authorize(delayedPayments.address))
          .then(() => delayedPayments.setupEventsHistory(history.address))
          .then(() => console.log("[MIGRATION] [6] DelayedPayments: #done"))
}
