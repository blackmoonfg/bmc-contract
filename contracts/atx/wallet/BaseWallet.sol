pragma solidity ^0.4.18;


import "./DepositWalletInterface.sol";
import "../../core/common/Object.sol";


contract BaseWallet is Object, DepositWalletInterface {

    uint constant CUSTOMER_WALLET_SCOPE = 60000;
    uint constant CUSTOMER_WALLET_NOT_OK = CUSTOMER_WALLET_SCOPE + 1;

    address public customer;

    modifier onlyCustomer() {
        if (msg.sender != customer) {
            revert();
        }
        _;
    }

    function() public payable {
        revert();
    }

    /// Init contract by setting Emission ProviderWallet address
    /// that can be associated and have an account for this contract
    ///
    /// @dev Allowed only for contract owner
    ///
    /// @param _customer Emission Provider address
    ///
    /// @return  code
    function init(address _customer) public onlyContractOwner returns (uint code) {
        require(_customer != 0x0);
        customer = _customer;
        return OK;
    }

    /// Call `selfdestruct` when contract is not needed anymore. Also takes a list of tokens
    /// that can be associated and have an account for this contract
    ///
    /// @dev Allowed only for contract owner
    ///
    /// @param tokens an array of tokens addresses
    function destroy(address[] tokens) public onlyContractOwner {
        withdrawnTokens(tokens, msg.sender);
        selfdestruct(msg.sender);
    }

    /// @dev Call destroy(address[] tokens) instead
    function destroy() public onlyContractOwner {
        revert();
    }

    /// Deposits some amount of tokens on wallet's account using ERC20 tokens
    ///
    /// @dev Allowed only for rewards
    ///
    /// @param _asset an address of token
    /// @param _from an address of a sender who is willing to transfer her resources
    /// @param _amount an amount of tokens (resources) a sender wants to transfer
    ///
    /// @return code
    function deposit(address _asset, address _from, uint256 _amount) public onlyCustomer returns (uint) {
        if (!ERC20Interface(_asset).transferFrom(_from, this, _amount)) {
            return CUSTOMER_WALLET_NOT_OK;
        }
        return OK;
    }

    /// Withdraws some amount of tokens from wallet's account using ERC20 tokens
    ///
    /// @dev Allowed only for rewards
    ///
    /// @param _asset an address of token
    /// @param _to an address of a receiver who is willing to get stored resources
    /// @param _amount an amount of tokens (resources) a receiver wants to get
    ///
    /// @return  code
    function withdraw(address _asset, address _to, uint256 _amount) public onlyCustomer returns (uint) {
        if (!ERC20Interface(_asset).transfer(_to, _amount)) {
            return CUSTOMER_WALLET_NOT_OK;
        }
        return OK;
    }

    /// Approve some amount of tokens from wallet's account using ERC20 tokens
    ///
    /// @dev Allowed only for rewards
    ///
    /// @param _asset an address of token
    /// @param _to an address of a receiver who is willing to get stored resources
    /// @param _amount an amount of tokens (resources) a receiver wants to get
    ///
    /// @return  code
    function approve(address _asset, address _to, uint256 _amount) public onlyCustomer returns (uint) {
        if (!ERC20Interface(_asset).approve(_to, _amount)) {
            return CUSTOMER_WALLET_NOT_OK;
        }
        return OK;
    }
}
