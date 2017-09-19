var HDWalletProvider = require("truffle-hdwallet-provider");

function getWallet(network){
  try{
    return require('fs').readFileSync("/Volumes/BMC_deploy_keys/keystore/wallet_"+network+".json", "utf8").trim();
  } catch(err){
    return "";
  }
}
function getPassphrase(network){
  try{
    return require('fs').readFileSync("/Volumes/BMC_deploy_pp/passphrase/pp_"+network+".bin", "utf8").trim();
  } catch(err){
    return "";
  }
}

module.exports = {
networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 4700000
    },
    kovan: {
        network_id: 42,
        provider: new HDWalletProvider(getWallet('kovan'),getPassphrase('kovan'),'https://kovan.chronobank.io/'),
        gas: 6500000,
        gasPrice: 20000000000 // 20 Gwei
    },
    kovan_eco: {
        network_id: 42,
        provider: new HDWalletProvider(getWallet('kovan'),getPassphrase('kovan'),'https://kovan.chronobank.io/'),
        gas: 6500000,
        gasPrice:  1000000000 // 1 Gwei
    },
    rinkeby: {
        network_id: 4,
        provider: new HDWalletProvider(getWallet('rinkeby'),getPassphrase('rinkeby'),'https://rinkeby.chronobank.io/'),
        gas: 4700000,
        gasPrice: 20000000000 // 20 Gwei
    },
    rinkeby_eco: {
        network_id: 4,
        provider: new HDWalletProvider(getWallet('rinkeby'),getPassphrase('rinkeby'),'https://rinkeby.chronobank.io/'),
        gas: 4700000,
        gasPrice:  1000000000 // 1 Gwei
    },
    mainnet: {
        network_id: 1,
        provider: new HDWalletProvider(getWallet('mainnet'),getPassphrase('mainnet'),'https://mainnet.chronobank.io/'),
        gas: 6500000,
        gasPrice: 20000000000 // 20 Gwei
    },
    mainnet_eco: {
        network_id: 1,
        provider: new HDWalletProvider(getWallet('mainnet'),getPassphrase('mainnet'),'https://mainnet.chronobank.io/'),
        gas: 6500000,
        gasPrice: 1000000000 // 1 Gwei
    },
    test: {
        network_id: 424242,
        host: 'localhost',
        port: 8545,
        gas: 4700000
    }
  },
  migrations_directory: './migrations'
}
