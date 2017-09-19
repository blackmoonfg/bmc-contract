var SafeMath = artifacts.require("./SafeMath.sol");

module.exports = function(deployer,network) {
    deployer.deploy(SafeMath)
        .then(() => console.log("[MIGRATION] [2] SafeMath: #done"))
}
