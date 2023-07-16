pragma solidity ^0.5.0;

import "./Tether.sol";
import "./RWD.sol";

contract DecentralBank {
    string public name = "Decentral Bank";
    address public owner;
    Tether public tether;
    RWD public rwd;

    address [] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(RWD _rwd, Tether _tether) public {
        owner = msg.sender;
        tether = _tether;
        rwd = _rwd;
    }
    
    // staking function
    function depositTokens(uint amount) public {
        require(amount > 0,'Amount should be greater than 0');
        //Transfer tehter tokens to this contract address for staking  
        tether.transferFrom(msg.sender, address(this), amount);

        //Update staking balance
        stakingBalance[msg.sender] += amount;

        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        //Update staking
        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    // unstake tokens
    function unstakeTokens() public {
        uint balance = stakingBalance[msg.sender];
        require(balance > 0, 'staking balance should be greater than 0');

        //transfer tokens to the specified address
        tether.transfer(msg.sender, balance);   //this function will be called by contract

        isStaking[msg.sender] = false;
    }

    //Issue rewards function
    function issueRewards() public {
        require(msg.sender == owner,"only owner can call this function");
        for(uint i=0; i<stakers.length; i++) {
            address recepient = stakers[i];
            uint balance = stakingBalance[recepient] / 9;   // divide by 9 to create percentage incentive for stakers
            if(balance > 0) {
                rwd.transfer(recepient, balance);
            }
        }
    }
}