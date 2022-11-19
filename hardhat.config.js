require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.10",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.POLYGON_MUMBAI_RPC_URL,
        blockNumber: 29219806,
      },
    },
    mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL,
      accounts: [
        process.env.CONTRACT_ADMINISTRATOR_WALLET_PRIVATE_KEY,
        process.env.RENTER_WALLET_PRIVATE_KEY,
      ],
    },
  },
  mocha: {
    timeout: 40000000,
  },
  // etherscan: {
  //   apiKey: {
  //     polygonMumbai: process.env.POLYGONSCAN_API_KEY,
  //   },
  // },
};
