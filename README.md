# SmartDeposit

# Description

This application was done during the [ChainLink Hackathon Fall 2022]()

## Contracts deployed on Polygon testnet Mumbai :

- VaultFactory contract [0xC7433eBC21b216fe6484DA1b8A7bC3e4b1055279](https://mumbai.polygonscan.com/address/0xC7433eBC21b216fe6484DA1b8A7bC3e4b1055279)
- VaultImplementation BASE contract [0x9F5bc02E5167FE98C4933BE0a8A7DBC217F7cb78](https://mumbai.polygonscan.com/address/0x9F5bc02E5167FE98C4933BE0a8A7DBC217F7cb78)

## Inspiration

In many countries, flat tenants and landlords agree on a certain amount of money (called security deposit) to be given by the tenant and stored in the landlord’s or a third party’s bank account. This amount of money is returned in total or in part to the tenant at the end of the rental period if the flat didn't get damaged.

This system has multiple problems. When using a third party, both tenant and landlord need to trust the company they store the deposit to. When the deposit is just sent to the owner's bank account, the tenant still needs to trust this person. In any situations, some people in the deal are never really sure they'll see their money again. In addition to that, the process is cumbersome, especially in underprivileged parts of the world, because both parties need a bank account, because sending the funds can take long enough to threaten the conclusion of the deal, and because you might even need a clerk to oversee the whole process. Imagine having to do this for amounts smaller than in real estate, like car rentals, construction machinery rentals etc.

## What it does

Thanks to SmartDeposit, all these problems are sorted. Any owner of any item can create a Vault in which the renter will send the deposit into. At the end of the rental period, owner & renter agree on an amount to be returned and both can withdraw their funds.

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

[SmartDeposit Live dApp](https://deposit-manager-front.vercel.app/)
