# BlackmoonCrypto Platform SmartContracts

BMC, BayBack and time-lock/vesting contracts.

- BMCPlatform.sol acts as a base for all tokens operation (like issuing, balance storage, transfer).
- BMCAsset.sol adds interface layout (described in BMCAssetInterface.sol)
- BMCAssetWithFee.sol extends BMCAsset.sol with operations fees logic.
- BMCAssetProxy.sol acts as a transaction proxy, provide an ERC20 interface (described in ERC20Interface.sol) and allows additional logic insertions and wallet access recovery in case of key loss.
- BMCPlatformEmitter.sol provides platform events definition.

To understand contract logic better you can take a look at the comments also as at unit tests

## Testing

NodeJS 6+ required.
```bash
npm install -g ethereumjs-testrpc
npm install -g truffle
```

Then start TestRPC in a separate terminal by doing
```bash
testrpc
```

Then run tests in a project dir by doing
```bash
truffle compile
truffle test
```
