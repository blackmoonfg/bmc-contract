module.exports = {
	networks: {
		development: {
			host: '127.0.0.1',
			port: 8545,
			network_id: '*', // Match any network id
			gas: 4700000,
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
