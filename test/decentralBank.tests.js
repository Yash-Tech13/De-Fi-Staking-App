const { before } = require('node:test')

const Tether = artifacts.require('Tether')
const DecentralBank = artifacts.require('DecentralBank')
const RWD = artifacts.require("RWD")

require('chai')
.use(require('chai-as-promised'))
.should()

contract('DecentralBank', ([owner, customer]) => {
    // All of the code goes here for testing
    let tether, rwd, decentralBank;

    function tokens(number) {
        return web3.utils.toWei(number, 'ether');
    }

    beforeEach(async() => {
        // Load contracts
        tether = await Tether.new();
        rwd = await RWD.new();
        decentralBank = await DecentralBank.new(rwd.address, tether.address);

        //Transfer all tokens to DecentralBank (1 million)
        await rwd.transfer(decentralBank.address, tokens('1000000'));

        // Transfer 100 mock tethers to customer
        await tether.transfer(customer, tokens('100'), {from:owner});
    })

    describe('Mock Tether Deployment', async() => {
        it('Matches name successfully', async() => {
            const name = await tether.name();
            assert.equal(name, "Mock Tether Token");
        })

        it('Matches symbol successfully', async() => {
            const symbol = await tether.symbol();
            assert.equal(symbol, "mUSDT");
        })
    })

    describe('RWD Deployment', async() => {
        it('Matches name successfully', async() => {
            const name = await rwd.name();
            assert.equal(name, "Reward Token");
        })
    })

    describe('Decentral Bank Deployment', async() => {
        it('Matches name successfully', async() => {
            const name = await decentralBank.name();
            assert.equal(name, "Decentral Bank");
        })

        it('Contract has tokens', async() => {
            let balance = await rwd.balanceOf(decentralBank.address);
            assert.equal(balance, tokens('1000000'));
        })

        describe('Yeild Farming', async() => {
            it("reward tokesn for staking", async() => {
                let result;

                result = await tether.balanceOf(customer);
                assert.equal(result, tokens('100'), 'customer mock tether balance before staking');

                //check staking for customer
                await tether.approve(decentralBank.address, tokens('100'), {from:customer});
                await decentralBank.depositTokens(tokens('100'), {from:customer});

                //check updated balance of customer
                result = await tether.balanceOf(customer);
                assert.equal(result, tokens('0'), 'customer mock tether balance after staking');

                //check decentralBank balance after staking
                result =  await tether.balanceOf(decentralBank.address);
                assert.equal(result, tokens('100'), 'decentralBank balance after staking');

                //check isStaking status
                result = await decentralBank.isStaking(customer);
                assert.equal(result, true);

                //check issueTokens function
                await decentralBank.issueRewards({from:owner});

                //ensure only the owner can issue tokens
                await decentralBank.issueRewards({from:customer}).should.be.rejected;

                //check unstake tokens funciton
                await decentralBank.unstakeTokens({from: customer});

                //check balance after unstaking
                result = await tether.balanceOf(customer);
                assert.equal(result, tokens('100'), 'customer mock tether balance after unstaking');

                //check decentralBank balance after unstaking
                result =  await tether.balanceOf(decentralBank.address);
                assert.equal(result, tokens('0'), 'decentralBank balance after unstaking');

                //check isStaking status
                result = await decentralBank.isStaking(customer);
                assert.equal(result, false);
            })
        })
    })


})