# Steps Toward Fostering Peer-to-Peer Blockchain-based Data Markets

This repository contains code for the paper <i>Steps Toward Fostering Peer-to-Peer Blockchain-based Data Markets</i>.


### Smart Contracts (Solidity)
* `contracts/Dataquery.sol`: Contains the smart contracts for deals and the bank contract for managing accounts and payments.
* `contracts/Migrations.sol`: Migrations for the Ethereum blockchain.

The smart contracts `Dataquery` and `Bank` are deployed to the Rinkeby Blockchain. Please check their addresses in
`src/js/constants.js`. `DEAL_ADDRESS` refers to `Dataquery` and `BANK_ADDRESS` refers to `Bank`.


### Demonstrator App
The demonstrator app is located in the `src` folder. It is implemented in `javascript` / `jquery` and uses `web3.js` to connect to the blockchain. We use [infura](https://infura.io/) to connect to the Rinkeby network.

Important files:
* `src/js/app.js`:  Main application.
* `src/js/constants.js`: Contains configurations, addresses on the blockchain, keys, etc.
* `src/js/dl.js`: Code related to Deals.
* `src/js/ui.js`: Handles UI updates.



### Versions
Please make sure to use the same versions to avoid issues.

* `solidity 0.5.0`
* `web3.js 1.0.0.-beta.33`


