var SafeMath = artifacts.require("./SafeMath.sol")

module.exports = function(deployer) {
	deployer.deploy(SafeMath)
		.then(() => console.log("[MIGRATION] [2] SafeMath: #done"))
}
