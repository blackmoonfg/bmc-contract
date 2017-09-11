var MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");

module.exports = function(deployer,network) {
    deployer.deploy(MultiEventsHistory)
        .then(() => console.log("[MIGRATION] [2] Events History: #done"))
}
