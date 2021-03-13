/***
 * App handles the connection to INFURA and all requests to the blockchain, e.g. create a deal, confirm deal, etc.
 */

var App = {
    web3Provider: null,

    web3: null,
    contracts: {},
    account: '0x0',
    deal: null,
    deals: [],
    bankAddress: null,
    startBlock: null,
    subscriptions: {},
    pendingTransactions: [],

    init: function () {
        return App.initWeb3();
    },
    initWeb3: async function () {
        App.web3Provider = new Web3.providers.WebsocketProvider(
            Constants.WEBSOCKET_PROVIDER,
        );
        App.web3 = new Web3(App.web3Provider);
        App.startBlock = await App.web3.eth.getBlockNumber();
        return App.initContract();
    },
    initContract: async function () {
        // Dynamically set correct values for create Deal form
        $('#div-consumer').text(Constants.CONSUMER.ADDRESS);
        $('select[name="select-host"] option')[0].innerHTML = Constants.HOST.ADDRESS;
        var producers = $('select[name="select-producers"] option');
        for (var i = 0; i < producers.length; i++) {
            producers[i].innerHTML = Constants.PRODUCERS[i].ADDRESS;
        }

        var json_interface = await $.getJSON("build/contracts/Dataquery.json", function(dataquery){
            return dataquery;
        });
        const abi = json_interface.abi;
        App.contracts.Dataquery = new App.web3.eth.Contract(abi, Constants.DEAL_ADDRESS);
        // Connect provider to interact with contract
        App.contracts.Dataquery.setProvider(App.web3Provider);
        $('#log').val('');

        UI.updateDeposit();
    },
    updateModal: async function(){
        $('#infobox').modal("hide");
    },
    updateAndRefresh: function (force) {
        let actionBtns = $('.btn-deal-action');
        actionBtns.prop('disabled', true);
        actionBtns.click(UI.triggerModal);
        $('.btn-create-deal').prop('disabled', false);

        if (App.deal) {
            App.updateDeal(force);
            UI.refresh(App.deal);

        }
        App.updateModal();
    },
    getSignature: async function (name) {
        return App.getJsonInterface(name).signature;
    },
    getJsonInterface: function(name){
        let json_interface = App.contracts.Dataquery._jsonInterface;
        let result = App.web3.utils._.find(json_interface, function (o) {
            return o.name === name
        });
        return result;
    },
    hasMethod: async function (contractAddress, signature) {
        const code = await App.web3.eth.getCode(contractAddress);
        const hash = App.web3.eth.abi.encodeFunctionSignature(signature);
        return code.indexOf(hash.slice(2, hash.length)) > 0;
    },
    render: async function () {
        var loader = $("#loader");
        loader.show();
        await App.updateAndRefresh();
    },
    sendEther: function(from, to, from_pk, value){
        App.makeTransaction(from, to, from_pk, null, value);
    },
    /**
     *
     * @param account_from 0x... address
     * @param account_to 0x... address
     * @param account_from_pk private key (non hex), e.g. "ads9fsad..."
     * @param data e.g. App.contracts.Dataquery.methods.createDeal(...).encodeABI();
     * @param value in wei
     * @param callback function
     * @returns {Promise.<void>}
     */
    makeTransaction: async function (account_from, account_to, account_from_pk, data, value, callback) {
        var gasLimit =  2900000;
        var buffered_pk = Buffer.Buffer.from(account_from_pk, 'hex');
        const txCount = await App.web3.eth.getTransactionCount(account_from, 'pending');

        const txObject = {
            nonce: App.web3.utils.toHex(txCount),
            gasLimit: gasLimit,
            gasPrice: App.web3.utils.toHex(App.web3.utils.toWei('10', 'gwei')),
            from: account_from,
            to: account_to,
            value: value,
            data: data
        };
        const tx = new ethereumjs.Tx(txObject);
        tx.sign(buffered_pk);

        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex');
        // console.log(raw);
        App.web3.eth.sendSignedTransaction(raw, function(error, txHash) {
                if (error) {
                    log("Something went wrong. Please check console for error");
                    console.log(error);
                } else {
                    // console.log(r);
                    if (callback) {
                        callback(txHash);
                    } else {
                        console.log("no callback provided");
                    }
                    console.log("transaction hash: " + txHash);
                }
            }
        );
    },
    /*
    * ==== All requests
    * */
    createDealRequest: async function () {
        App.deal = Deal();
        var producers = UI.getSelectedProducers();
        // var consumer = deal.data.consumer;
        var host = UI.getHost();
        var deposit = UI.getDeposit();
        var pricePerProducer = UI.pricePerProducer();
        var producerShare = UI.getProducerShare();
        var passwordEncrypted = App.deal.getPassword("encrypted");
        App.deal.data.dealId = parseInt(await App.contracts.Dataquery.methods.dealCount().call());
        let data = App.contracts.Dataquery.methods.createDeal(App.deal.data.dealId, producers, host, deposit, pricePerProducer, producerShare, passwordEncrypted).encodeABI();
        console.log("Making transaction...");
        var txHash = App.makeTransaction(Constants.CONSUMER.ADDRESS, App.contracts.Dataquery.options.address, Constants.CONSUMER.PK, data, deposit, function (transactionHash) {
            console.log(transactionHash);
            log("Creating deal. "+App.createEtherscanLink(transactionHash));
            console.log(transactionHash);
            App.pendingTransactions.push(transactionHash);
            return transactionHash;
        });
        return txHash;
    },
    confirmDealRequest: async function() {
        UI.makeDealPending();
        let data = App.contracts.Dataquery.methods.confirmDeal(App.deal.data.dealId).encodeABI();
        var txHash = App.makeTransaction(Constants.HOST.ADDRESS, App.contracts.Dataquery.options.address, Constants.HOST.PK, data, null, function (transactionHash) {
            console.log(transactionHash);
            log("Confirming deal with id '"+App.deal.data.dealId+"'. "+App.createEtherscanLink(transactionHash));
            console.log(transactionHash);
            App.pendingTransactions.push(transactionHash);
            return transactionHash;
        });
        return txHash;
    },
    confirmConsentRequest: async function (producer) {
        UI.makeDealPending();
        let pk = "";
        for (var i=0; i<Constants.PRODUCERS.length; i++){
            if (Constants.PRODUCERS[i].ADDRESS.toLowerCase() === producer.toLowerCase()){
                pk = Constants.PRODUCERS[i].PK;
            }
        }
        let data = App.contracts.Dataquery.methods.confirmConsent(App.deal.data.dealId).encodeABI();
        var txHash = await App.makeTransaction(producer, App.contracts.Dataquery.options.address, pk, data, null, function (transactionHash) {
            console.log(transactionHash);
            log('Confirming Consent for deal ' + App.deal.data.dealId + ' and producer ' + producer + '. '+App.createEtherscanLink(transactionHash));
            console.log(transactionHash);
            App.pendingTransactions.push(transactionHash);
            return transactionHash;
        });
        return txHash;
    },
    lockDealRequest: async function () {
        UI.makeDealPending();
        var dealId = App.deal.data.dealId;
        var price = await App.estimatePrice(dealId);
        var consumer = Constants.CONSUMER.ADDRESS;
        let data = App.contracts.Dataquery.methods.lockDeal(dealId).encodeABI();
        var txHash = await App.makeTransaction(consumer, App.contracts.Dataquery.options.address, Constants.CONSUMER.PK, data, price, function (transactionHash) {
            console.log(transactionHash);
            log("Locking deal " + dealId + ". Price: " + price + ", consumer " + consumer +". "+App.createEtherscanLink(transactionHash));
            console.log(transactionHash);
            App.pendingTransactions.push(transactionHash);
            return transactionHash;
        });
        return txHash;
    },
    verifyDealRequest: async function (dealId) {
        dealId = this.getDealIdIfFalse(dealId);
        var response = await App.contracts.Dataquery.methods.getDealPassword(dealId).call();
        console.log(response);
        var passwordEncrypted = response.toString();
        var passwordDecrypted = decrypt(passwordEncrypted, Constants.HOST.PRIVATE_KEY);
        var passwordCorrect = App.deal.data.password.plainText;
        if (passwordDecrypted === passwordCorrect) {
            log("Verified deal '" + dealId+"'.");
            App.deal.data.verified = "VERIFIED";
            App.deal.data.status = "VERIFIED";
        } else {
            App.deal.data.verified = false;
            log("Not matching passwords. passwordEncrypted / Decrypted: " + passwordEncrypted + " " + passwordDecrypted);
        }
        App.updateAndRefresh();
    },
    confirmDealReceivedRequest: async function () {
        UI.makeDealPending();
        const dealId = App.deal.data.dealId;
        let data = App.contracts.Dataquery.methods.confirmDealReceived(dealId).encodeABI();
        var txHash = await App.makeTransaction(Constants.CONSUMER.ADDRESS, App.contracts.Dataquery.options.address, Constants.CONSUMER.PK, data, null, function (transactionHash) {
            console.log(transactionHash);
            log("Finalizing with with id '"+dealId+"'. "+App.createEtherscanLink(transactionHash));
            console.log(transactionHash);
            App.pendingTransactions.push(transactionHash);
            return transactionHash;
        });
        return txHash;
    },
    /*
    * UI Updates
    * */
    updateDeal: async function(force){
        if (!App.deal || typeof App.deal.data.dealId === "undefined" && !force){
            return
        }
        try {
            let result = await App.contracts.Dataquery.methods.getDeal(App.deal.data.dealId).call();

            // We hash the response to check whether something has changed
            const new_hash = objectHash.sha1(result);
            if (new_hash !== App.deal.data.hash) {
                App.deal.update(result);
                App.deal.data.hash = new_hash;
            }
        } catch(error){
                console.log("Could not update deal");
        }
    },
    reset: function () {
        App.render();
    },

    /*
    * Helper functions
    * */
    deploy: function(){
    },
    getBankAddress: async function () {
        var result = await App.contracts.Dataquery.at(App.contracts.Dataquery.address).getBankAddress();
        return result;
    },
    getDealStatus: async function (dealId) {
        let result = await App.contracts.Dataquery.at(App.contracts.Dataquery.address).getDealStatus(dealId);
        return Constants.DEALSTATES[result.toNumber()];
    },
    getBankBalance: async function () {
        if (!App.bankAddress) {
            App.bankAddress = await App.getBankAddress();
        }
        return await App.web3.fromWei(App.web3.eth.getBalance(App.bankAddress)).toNumber();
    },
    calculateDepositRequest: async function (numberUsers, pricePerProducer) {
        var response = await App.contracts.Dataquery.methods.calculateDeposit(numberUsers, pricePerProducer).call();
        return new Number(response);
    },
    getDealIdIfFalse: function (dealId) {
        if (!dealId) {
            return this.deal.data.dealId;
        } else {
            return dealId;
        }
    },
    estimatePrice: async function (dealId) {
        let result = await App.contracts.Dataquery.methods.estimatePrice(App.deal.data.dealId).call();
        var price = parseInt(result);
        return price;
    },
    getAccountBalances: function () {
        for (var i = 0; i < App.web3.eth.accounts.length; i++) {
            let account = App.web3.eth.accounts[i];
            console.log(account, eth.getBalance(account));
        }
    },
    createEtherscanLink: function(txHash){
        const link = Constants.ETHERSCAN_URL + txHash;
        return "<a href='"+link+"' title='Etherscan URL' target='_blank'>Check out on Etherscan</a>";
    },
};

window.App = App;

function validateCreateContractForm(callback) {
    var parsley_validation = $('#form-create-deal').parsley();
    var validated = parsley_validation.validate();

    var ok = $('.parsley-error').length === 0;
    $('.bs-callout-info').toggleClass('hidden', !ok);
    $('.bs-callout-warning').toggleClass('hidden', ok);
    if (validated) {
        if (callback) {
            callback();
        }

    } else {
        $('.btn-create-deal').prop('disabled', 'disabled');
    }

}

$(function () {
    $(window).load(function () {
        App.init();

        // select all by default
        $('select[name="select-producers"] option').prop('selected', 'selected');
        $('select, input').change(App.updateAndRefresh);

        $('#form-create-deal input').change(function (e) {
            validateCreateContractForm();
        });
        // Fill the deposit value in for the first time

        poll(App.updateAndRefresh, 2000000, 5000);
    });
});