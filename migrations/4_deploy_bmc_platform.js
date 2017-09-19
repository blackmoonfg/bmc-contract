var BMCPlatform = artifacts.require("./BMCPlatform.sol");
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");

module.exports = function(deployer,network) {
      deployer.deploy(BMCPlatform)
          .then(() => MultiEventsHistory.deployed())
          .then(_history => history = _history )
          .then(() => BMCPlatform.deployed())
          .then(_platform => platform = _platform)
          .then(() => history.authorize(platform.address))
          .then(() => platform.setupEventsHistory(history.address))
          .then(() => console.log("[MIGRATION] [4] BMCPlatform: #done"))
}
