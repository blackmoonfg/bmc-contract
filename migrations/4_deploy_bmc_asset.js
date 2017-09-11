const BMCAssetProxy = artifacts.require("./BMCAssetProxy.sol");
const BMCPlatform = artifacts.require("./BMCPlatform.sol");
const BMC = artifacts.require("./BMC.sol");

module.exports = function(deployer,network) {
    const BMC_SYMBOL = 'BMC';
    const BMC_NAME = 'Black Moon Crypto Token';
    const BMC_DESCRIPTION = 'blackmooncrypto.com assets';

    const BASE_UNIT = 8;
    const IS_REISSUABLE = true;
    const IS_NOT_REISSUABLE = false;

    const VALUE = 10000; //should be changed to final ICO value before migration to mainnet

    const ICO_USD = 10; //should be changed to final ICO value before migration to mainnet
    const ICO_ETH = 10; //should be changed to final ICO value before migration to mainnet
    const ICO_BTC = 10; //should be changed to final ICO value before migration to mainnet
    const ICO_LTC = 10; //should be changed to final ICO value before migration to mainnet

    deployer
      .then(() => BMCPlatform.deployed())
      .then(_platform => platform = _platform)
      .then(() => platform.issueAsset(BMC_SYMBOL, VALUE, BMC_NAME, BMC_DESCRIPTION, BASE_UNIT, IS_NOT_REISSUABLE))
      .then(() => deployer.deploy(BMCAssetProxy))
      .then(() => BMCAssetProxy.deployed())
      .then(_proxy => _proxy.init(BMCPlatform.address, BMC_SYMBOL, BMC_NAME))
      .then(() => deployer.deploy(BMC))
      .then(() => BMC.deployed())
      .then(_asset => _asset.initBMC(BMCAssetProxy.address,ICO_USD,ICO_ETH,ICO_BTC,ICO_LTC))
      .then(() => BMCAssetProxy.deployed())
      .then(_proxy => _proxy.proposeUpgrade(BMC.address))
      .then(() => console.log("[MIGRATION] [4] BMC ASSET: #done"))
}
