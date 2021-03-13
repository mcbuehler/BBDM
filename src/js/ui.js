/***
 * Functions for updating the user interface.
 */

var UI = {
    getDealActionBtn: function (type, label, action_fn) {
        return '<div class="row"><button type="button" class="btn btn-primary btn-lg pull-right nextBtn ' + type + ' btn-deal-action" onclick="' + action_fn + '">' + label + '</button></div>';
    },
    getNextButton: function () {
        return '<hr><button class="btn btn-primary nextBtn btn-lg pull-right" type="button">Next</button>';
    },
    getRole: function () {
        return $('#slct-role').val();
    },
    getConsumer: function () {
        return $('#div-consumer').text();
    },
    getDealId: function () {
        return $('input[name="input-deal-id"]').val(dealId);
    },
    getSelectedProducers: function () {
        var producers = $('select[name="select-producers"]').val();
        return producers;
    },
    getDealStatus: function(index){
        return ["CREATED", "CONFIRMED", "LOCKED", "COMPLETED"][index];
    },
    getNumberOfSelectedProducers: function () {
        var producers = UI.getSelectedProducers();
        if (producers === null) {
            return 0;
        }
        else {
            return producers.length;
        }
    },
    pricePerProducer: function () {
        var pricePerUnit = $('input[name="input-price-per-unit"]').val();
        if (pricePerUnit) {
            return parseInt(pricePerUnit);
        } else {
            return 0;
        }
    },
    getProducerShare: function () {
        var producerShare = $('input[name="input-producer-share"]').val();
        if (producerShare) {
            return parseInt(producerShare);
        } else {
            return 0;
        }
    },
    getDeposit: function () {
        var deposit = $('input[name="input-deposit"]').val();
        return parseInt(deposit);
    },
    getHost: function () {
        var host = $('select[name="select-host"]').val();
        return host;
    },
    getConfirmButton: function (dealId) {
        return '<button type="button" class="btn btn-primary nextBtn btn-lg pull-right btn-confirm-deal btn-deal-action" onclick="">Confirm Deal</button>';
    },
    getConfirmConsentForm: function () {
        var form = '<div class="row"><label class="col-md-2 col-sm-6">Confirm producer: </label>';
        form += '<div class="btn-group" role="group" aria-label="Producer Consent Buttons">';
        for (var i = 0; i < Constants.PRODUCERS.length; i++) {
            var address = Constants.PRODUCERS[i].ADDRESS.toLowerCase();
            form += '<button id="btn-consent-' + address + '" class="btn btn-primary btn-deal-action btn-confirm-consent btn-lg" type="button" onclick="App.confirmConsentRequest(`' + address + '`)">' + i + '</button>';
        }
        ;
        form += '</div></div>';
        return form;
    },
    getLockDealButton: function (dealId) {
        return '<button type="button" class="btn btn-tertiary" onclick="App.lockDealRequest(' + dealId + ')">Lock Deal</button>';
    },
    getConfirmDealReceivedButton: function (dealId) {
        return '<button type="button" class="btn btn-tertiary" onclick="App.confirmDealReceivedRequest(' + dealId + ')">Confirm Deal Received</button>';
    },
    getVerifyDealButton: function (dealId) {
        return '<button type="button" class="btn btn-tertiary" onclick="App.verifyDealRequest(' + dealId + ')">Verify Deal</button>';
    },
    updateDeposit: async function(){
        let numberUsers = $('select[name="select-producers"]').val().length;
        let pricePerProducer = $('#input-price-per-unit').val();  // it is ok if this is a string
        let deposit = await App.calculateDepositRequest(numberUsers, pricePerProducer);
        $('#input-deposit-required').val(deposit);
        $('#input-price-per-unit-ether').val(wei2ETH(pricePerProducer));
        $('#input-deposit-required-eth').val(wei2ETH(deposit));
    },
    updatePricePerUnit: function(){
        let priceInETH = $('#input-price-per-unit-ether').val();
        let priceInWei = ETH2wei(priceInETH);
        $('#input-price-per-unit').val(priceInWei);
        this.updateDeposit();
    },
    updateDealsOverview: function (deals) {
        var tableBody = $('#tbl-deals-overview tbody');
        tableBody.find('tr').remove();
        var role = UI.getRole();
        deals.forEach(function (deal, dealId) {
            var actions = [];
            if (role === "host" && deal.status === "CREATED") {
                var confirmDealBtn = UI.getConfirmButton(dealId);
                actions.push(confirmDealBtn);
            }
            if (role === "producer" && (deal.status === "CONFIRMED" || deal.status === "CONSENT GRANTED")) {
                var confirmConsentForm = UI.getConfirmConsentForm(dealId);
                actions.push(confirmConsentForm);
            }
            if (role === "consumer" && deal.status === "CONSENT GRANTED") {
                var lockDealBtn = UI.getLockDealButton(dealId);
                actions.push(lockDealBtn);
            }
            if (role === "host" && deal.status === "LOCKED") {
                var verifyDealBtn = UI.getVerifyDealButton(dealId);
                actions.push(verifyDealBtn);
            }
            if (role === "consumer" && deal.status === "VERIFIED") {
                var confirmDealReceivedButton = UI.getConfirmDealReceivedButton(dealId);
                actions.push(confirmDealReceivedButton);
            }
            var actionBtns = [];
            actions.forEach(function (action) {
                actionBtns += '<div class="row">' + action + '</div>';
            });
            var row = '\
      <tr>\
      <td>' + dealId + '</td>\
      <td>' + deal.status + '</td>\
      <td>' + actionBtns + '</td>\
      </tr>\
      ';
            tableBody.append(row);
        });
    },
    makeDealPending: function(){
        App.deal.data.status = "PENDING...";
    },
    updateActionButtons: function (deal) {
        let actionButtons = $('.btn-deal-action');
        actionButtons.prop('disabled', true);
        // We hide all of them by default, and later display the ones that have been selected when the contract was created.
        // Consent buttons
        $('.btn-confirm-consent').hide();
        for (var i = 0; i < deal.producers.length; i++) {
            $('#btn-consent-' + deal.producers[i].toLowerCase()).show();
        }

        if (deal.status === "CREATED") {
            $('.btn-deal-confirm').prop('disabled', false);
        }
        if (deal.status === "CONFIRMED") {
            let producersLowercase = deal.producers.map(function (value) {
                return value.toLowerCase();
            });
            let producersWithConsentLowercase = deal.producersWithConsent.map(function (value) {
                return value.toLowerCase();
            });
            let producersWithConsent = producersLowercase.diff(producersWithConsentLowercase);

            for (var i = 0; i < producersWithConsent.length; i++) {
                $('#btn-consent-' + producersWithConsent[i]).prop('disabled', false);
            }
        }
        if (deal.status === "CONFIRMED" && deal.producersWithConsent.length > 0) {
            $('.btn-deal-lock').prop('disabled', false);
        }
        if (deal.status === "LOCKED") {
            $('.btn-verify-deal').prop('disabled', false);
        }
        if (deal.status === "LOCKED" || deal.status === "VERIFIED" && deal.verified) {
            $('.btn-confirm-deal-received').prop('disabled', false);
        }

        $('.btn-create-deal').prop('disabled', false);
    },
    triggerModal: function(){
        let spinner = $('#infobox').modal();
    },
    updateDealInfo(data){
        $('input[name="input-deposit"]').val(data.deposit);

        $('.info-deal-id').text(data.dealId);
        $('.info-deal-status').text(data.status);

        $('.info-deal-consenting-producers').text(data.producersWithConsent.length);
    },
    refresh: function (currentDeal) {

        // Hack to keep app functional
        var data = currentDeal.data;
        // update deposit field
        UI.updateDealInfo(data);

        UI.updateDeposit();

        if (data.producers)
            this.updateActionButtons(data);
    }
};


function log(message) {
    var element = $('#log');
    var date = new Date().toLocaleString();
    var newContent = date + " " + message + "<br>";
    element.html(element.html() + newContent);
    element.height((element.html().match(/\n/g)||[]).length + 1+"em");
    console.log(message);
}


// The polling function
function poll(fn, timeout, interval) {
    var endTime = Number(new Date()) + (timeout || 2000000);
    interval = interval || 5000;

    var checkCondition = function(resolve, reject) {
        // If the condition is met, we're done!
        var result = fn();
        if(result) {
            resolve(result);
        }
        // If the condition isn't met but the timeout hasn't elapsed, go again
        else if (Number(new Date()) < endTime) {
            setTimeout(checkCondition, interval, resolve, reject);
        }
        // Didn't match and too much time, reject!
        else {
            reject(new Error('timed out for ' + fn + ': ' + arguments));
        }
    };

    return new Promise(checkCondition);
}

