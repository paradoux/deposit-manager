# SmartDeposit

# Description

This application was done during the [ChainLink Hackathon Fall 2022]()

## Contracts deployed on POLYGON TESTNET MUMBAI :

**PRIMARY :**

- VaultFactory contract [0xC7433eBC21b216fe6484DA1b8A7bC3e4b1055279](https://mumbai.polygonscan.com/address/0xC7433eBC21b216fe6484DA1b8A7bC3e4b1055279)
- VaultImplementation BASE contract [0x9F5bc02E5167FE98C4933BE0a8A7DBC217F7cb78](https://mumbai.polygonscan.com/address/0x9F5bc02E5167FE98C4933BE0a8A7DBC217F7cb78)

## Inspiration

We could run into a storytelling exercise and tell you that this was thought of as an innovative new way to engage your web3 community on twitter while providing a simple and fun experience.

And in retrospect, it can be. But the fact is the original goal was just to find a fun way to learn Web3 because in reality... It's just a fucking game :)

## What it does

Let's Fucking Game allows you to create "one button games" to engage your community in order to provide them with a fun way to engage with your content.

The games can be free (the creator deposits the total prizepool of the game) or paid for by the players (the prizepool is composed of the players' registration fees).

Once the total number of players is reached, the game starts.

## How it works

As a player, you'll have to interact with the game smart contract each day during a random time slot. This time slot change everyday and could be during the day or during the night. If you forget just once, you lose.

The last remaining players share the prizes according to the prizepool repartition.

When there is less than 50% players, a player can vote to split pot between remaining players. If all remaining players are ok to split pot then the pot is fairly distributed between remaining players .

The creator can manage the size of the slots and the frequency of the games to make the game last more or less time.

The game creator can also manage the winners structure to allow more or less players to win more or less part of the prizepool.

## Built with

- [Solidity](https://docs.soliditylang.org/en/v0.8.17/)
- [Hardhat](https://hardhat.org)
- [Ethers.js](https://docs.ethers.io/v5/)
- [TypeScript](https://www.typescriptlang.org)
- [Vercel](https://vercel.com/)
- [React](https://reactjs.org/)
- [Netlify Serverless Functions](https://www.netlify.com/products/functions/)

  <!-- - [Chainlink Keeper](https://docs.chain.link/docs/chainlink-automation/introduction/)
  - [TypeChain](https://github.com/dethcrypto/TypeChain) - Hooking with [Wagmi](https://github.com/wagmi-dev/wagmi) - Securing with [Mythril](https://github.com/ConsenSys/mythril) - Analyzing with [Slither](https://github.com/crytic/slither) - Coverage with [Solidity Coverage](https://github.com/sc-forks/solidity-coverage) - Linting with [Solhint](https://github.com/protofire/solhint) - Linting with [ESLint](https://eslint.org) - Formatting with [Prettier](https://prettier.io) -->

# Live demo

[SmartDeposit Live dApp](https://reactjs.org/)https://deposit-manager-front.vercel.app/
