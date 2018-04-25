var HDWalletProvider = require("truffle-hdwallet-provider")

function getWallet(){
	// try{
	//   return require('fs').readFileSync("/Volumes/BMC_deploy_keys/keystore/wallet_"+network+".json", "utf8").trim();
	// } catch(err){
	//   return "";
	// }
	return {
		version: 3,
		id: "fbd6db63-8eab-42df-85c3-962840013aeb",
		address: "4a2d3fc1587494ca2ca9cdeb457cd94be5d96a61",
		crypto: {
			ciphertext: "740fd8586795921cd7f3dbc1233c37913bcfa4a729e2aafe13ac1b4b5b0ce4b2",
			cipherparams: { iv: "787217097e731736795194356475c316", },
			cipher: "aes-128-ctr",
			kdf: "scrypt",
			kdfparams: {
				dklen: 32, salt: "1f4887d8342f50a20b08a962d26e4775555aeecd13b1037203b0cefff562e105", n: 1024, r: 8, p: 1,
			},
			mac: "5865188367e6bdb70ace7460c8ce5f4cff0eec0ee5abf6607ee412e0ec638f27",
		},
	}

}
function getPassphrase(){
	// try{
	//   return require('fs').readFileSync("/Volumes/BMC_deploy_pp/passphrase/pp_"+network+".bin", "utf8").trim();
	// } catch(err){
	//   return "";
	// }
	return "QWEpoi123"
}

module.exports = {
	networks: {
		development: {
			host: '127.0.0.1',
			port: 8545,
			network_id: '*', // Match any network id
			gas: 4700000,
		},
		kovan: {
			network_id: 42,
			provider: new HDWalletProvider(getWallet('kovan'), getPassphrase('kovan'), 'https://kovan.chronobank.io/'),
			gas: 6500000,
			gasPrice: 20000000000, // 20 Gwei
		},
		kovan_eco: {
			network_id: 42,
			provider: new HDWalletProvider(getWallet('kovan'), getPassphrase('kovan'), 'https://kovan.chronobank.io/'),
			gas: 6500000,
			gasPrice: 1000000000, // 1 Gwei
		},
		rinkeby: {
			network_id: 4,
			provider: new HDWalletProvider(getWallet('rinkeby'), getPassphrase('rinkeby'), 'https://rinkeby.chronobank.io/'),
			gas: 4700000,
			gasPrice: 20000000000, // 20 Gwei
		},
		rinkeby_eco: {
			network_id: 4,
			provider: new HDWalletProvider(getWallet('rinkeby'), getPassphrase('rinkeby'), 'https://rinkeby.chronobank.io/'),
			gas: 4700000,
			gasPrice: 1000000000, // 1 Gwei
		},
		mainnet: {
			network_id: 1,
			provider: new HDWalletProvider(getWallet('mainnet'), getPassphrase('mainnet'), 'https://mainnet.chronobank.io/'),
			gas: 6500000,
			gasPrice: 20000000000, // 20 Gwei
		},
		mainnet_eco: {
			network_id: 1,
			provider: new HDWalletProvider(getWallet('mainnet'), getPassphrase('mainnet'), 'https://mainnet.chronobank.io/'),
			gas: 6500000,
			gasPrice: 1000000000, // 1 Gwei
		},
		test: {
			network_id: 424242,
			host: '127.0.0.1',
			port: 8545,
			gas: 4700000,
		},
	},
	solc: {
		optimizer: {
			enabled: true,
			runs: 200,
		},
	},
	migrations_directory: './migrations',
}
