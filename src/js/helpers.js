
// use globally injected web3 to find the currentProvider and wrap with web3 v1.0
const getWeb3 = function(){
  const myWeb3 = new Web3(web3.currentProvider);
  return myWeb3;
};

// assumes passed-in web3 is v1.0 and creates a function to receive contract name
const getContractInstance = (web3) => (contractName) => {
  const artifact = artifacts.require(contractName); // globally injected artifacts helper
  const deployedAddress = artifact.networks[artifact.network_id].address;
  const instance = new web3.eth.Contract(artifact.abi, deployedAddress);
  return instance;
}


function logEvent(e) {
    console.log("Transaction hash: " + e.transactionHash + " block: " + e.blockHash);
}


function print_transation_log(account_from, account_to, account_from_pk, data, value, callback) {
    console.log("FROM: " + account_from + "   (PK: " + account_from_pk + ")");
    console.log("TO: " + account_to);
    console.log("VALUE: " + value);
    console.log("DATA: " + data);
    // console.log("TO: "+ callback);
}