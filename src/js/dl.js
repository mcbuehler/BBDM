/***
 * Functions in this script include functionality to manage deal instances.
 */


function decrypt(encrypted, privateKey) {
    var crypt = new JSEncrypt();
    crypt.setPrivateKey(privateKey);
    return crypt.decrypt(encrypted);
}

var Password = function Password() {
    var newPassword = {
        plainText: hat(),
        encrypted: null,
        encrypt: function (publicKey) {
            var encrypt = new JSEncrypt();
            encrypt.setPublicKey(publicKey);
            newPassword.encrypted = encrypt.encrypt(this.plainText);
            return newPassword.encrypted;
        },
    };
    return newPassword;
};

function calculateDeposit(numberProducers, pricePerUnit) {
    // This function needs to align with function in smart contract
    var transactionCountConsumer = 3;
    var transactionCountProvider = 2;
    var averageTransactionFee = Constants.ETHER / 10;
    var alpha = 50;
    var countTransactions = (numberProducers + transactionCountConsumer + transactionCountProvider);
    var holdout = numberProducers * pricePerUnit * alpha / 100;
    return Math.ceil(countTransactions * averageTransactionFee + holdout);
}

function Deal() {
    var newDeal = {
        data: {
            hash: "",
            dealId: null,
            status: "PENDING...",
            hostPublicKey: Constants.HOST.PUBLIC_KEY,
            password: Password(),
            producersWithConsent: []
        },
        update: function (new_d) {
            var d = newDeal.data;
            d.host = new_d.host;
            d.pricePerProducer = new_d.pricePerProducer;
            d.producers = new_d.producers;
            console.log(new_d.status);
            d.status = UI.getDealStatus(parseInt(new_d.status));
            d.producersWithConsent = new_d.producersWithConsent;
        },
        getPassword: function (encrypted) {
            var d = newDeal.data;
            if (encrypted) {
                return d.password.encrypted;
            }
            else {
                return d.password.plainText;
            }
        }
    };
    newDeal.data.password.encrypt(Constants.HOST.PUBLIC_KEY);
    return newDeal;
}


Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

function wei2ETH(wei){
    return wei / Constants.ETHER;
}

function ETH2wei(eth){
    return Constants.ETHER * eth;
}
