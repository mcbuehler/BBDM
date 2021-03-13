/**
 * This script adds the steps with their description and action sections to the user interface.
 * The content of the steps is saved as var STEPS.
 */

$(document).ready(function () {
    var navListItems = $('div.setup-panel div a'),
        allWells = $('.setup-content'),
        allNextBtn = $('.nextBtn'),
        allPrevBtn = $('.prevBtn');

    allWells.hide();

    navListItems.click(function (e) {
        e.preventDefault();
        var $target = $($(this).attr('href')),
            $item = $(this);

        if (!$item.hasClass('disabled')) {
            navListItems.removeClass('btn-primary').addClass('btn-default');
            $item.addClass('btn-primary');
            allWells.hide();
            $target.show();
            $target.find('input:eq(0)').focus();
        }
    });

    allPrevBtn.click(function () {
        var curStep = $(this).closest(".setup-content"),
            curStepBtn = curStep.attr("id"),
            prevStepWizard = $('div.setup-panel div a[href="#' + curStepBtn + '"]').parent().prev().children("a");

        prevStepWizard.removeAttr('disabled').trigger('click');
    });

    allNextBtn.click(function () {
        var curStep = $(this).closest(".setup-content"),
            curStepBtn = curStep.attr("id"),
            nextStepWizard = $('div.setup-panel div a[href="#' + curStepBtn + '"]').parent().next().children("a"),
            curInputs = curStep.find("input[type='text'],input[type='url']"),
            isValid = true;

        $(".form-group").removeClass("has-error");
        for (var i = 0; i < curInputs.length; i++) {
            if (!curInputs[i].validity.valid) {
                isValid = false;
                $(curInputs[i]).closest(".form-group").addClass("has-error");
            }
        }

        if (isValid)
            nextStepWizard.removeAttr('disabled').trigger('click');
    });

    $('a[href="#step-0"]').trigger('click');
});


var WorkflowFactory = WF = {
    addWorklowStepButton: function (stepNumber, label) {
        label = label.split(" ").join("<br>");
        var panelElement = $('#div-stepwizard-panel');
        var newStepButton = '<div class="stepwizard-step">\
      <a href="#step-' + stepNumber + '" type="button" class="btn btn-primary btn-circle">' + stepNumber + '</a>\
      <p class="p-label">' + label + '</p>\
    </div>';
        panelElement.append(newStepButton);
    },
    getStepTitle: function (title) {
        return '<h3>' + title + '</h3>';
    },
    addStepContent: function (stepNumber, title, acteurs, htmlContent, figure, actionContent) {
        let acteur_str = "";
        if (acteurs.length){
            acteur_str = "<div class=\"col-xs-12 col-md-12\" >Active participant(s): <b>"+acteurs.join(', ')+"</b></div>";
        }
        var newContent =
            '<div id="step-' + stepNumber + '" class="setup-content">'+
                '<div class="row">'+
                    '<div class="col-xs-12 col-md-12" >' + this.getStepTitle(title) + '</div>' +
                        acteur_str +
                    '<div class="col-xs-12 col-md-12" >'+
                        '<div class="row">' +
                            '<div class="col-md-6">' + htmlContent + '</div>'+
                            '<div class="col-md-6"><img class="full-width" src="/images/' + figure + '" alt="'+title+'"></div>'+
                        '</div>'+
                        '<div class="row">'+
                            '<div class="col-md-12">' + actionContent + '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
        $('#div-stepwizard-content').append(newContent);

    },
    addStep: function (stepNumber, stepData) {
        this.addWorklowStepButton(stepNumber, stepData.title);
        this.addStepContent(stepNumber, stepData.title, stepData.acteur, stepData.htmlContent, stepData.figure, stepData.actionContent);
    }
};


var STEPS = {
    0: {
        figure: '00_acteurs.png',
        // figure: '00_acteurs.svg',
        title: 'Overview',
        acteur: [],
        htmlContent: "<p>Welcome!</p>" +
        "<p>We are going to guide you through a deal in the data market. " +
        "There are three types of agents in the data market:</p>" +
        "<ul><li>Producers: Users of platforms that produce data online.</li>" +
        "<li>Consumers: Companies interested in buying the data.</li>" +
        "<li>Hosts: Platforms storing the producers’ data.</li>" +
        "</ul>The objective of the market is that producers can sell their data.</li>" +
        "<p>The data is generated and stored at the hosts’ database.</p>" +
        "<p>When the data is sold, the producer benefits from selling the data, the host gets compensated for opening and hosting the data, and the consumer benefits from the use of the new data.</p>",
        actionContent: UI.getNextButton()
    },
    1: {
        figure: '01_negotiation.svg',
        title: 'Negotiation',
        acteur: ["Consumer", "Host"],
        htmlContent: '<p>OFF-CHAIN</p>\
    <p>Consumer and host agree on the conditions of the deal:</p>\
<ol>\
<li>Type of data that is to be shared.</li>\
<li>Number of producers that will be asked to share their data.</li>\
<li>Price to be offered to the data producers.</li>\
</ol>\
<p>Note: The producer is not involved in this phase.</p>',
        actionContent: UI.getNextButton(),
    },
    2: {
        figure: '02_contract-creation.svg',
        title: 'Contract Creation',
        acteur: ["Consumer"],
        htmlContent: '<p>ON-CHAIN</p>\
    <p>The consumer creates a contract on the Blockchain.' +
        'This contract reflects the previous agreement.' +
        'The consumer pays a deposit consisting of a holdout and the transaction fees for the deal to occur.</p>',
        actionContent: $('#html-create-deal').html() + UI.getDealActionBtn("btn-create-deal", "Create Deal", "validateCreateContractForm(App.createDealRequest)"),
    },
    3: {
        figure: '03_contract-confirmation.svg',
        title: 'Host Confirmation',
        acteur: ["Host"],
        htmlContent: '<p>ON-CHAIN</p>\
    <p>The host can confirm or reject the deal.</p>',
        actionContent: $('#html-current-deal').html() + UI.getDealActionBtn("btn-deal-confirm", "Confirm Deal", "App.confirmDealRequest()"),
        //'<button class="btn btn-primary nextBtn btn-lg pull-right" type="button">Next</button>'
    },
    4: {
        figure: '04_consent.svg',
        title: 'Individual Decision',
        acteur: ["Producers"],
        htmlContent: '<p>ON- and OFF-CHAIN</p>\
    <p>The producers receive a notification from the data host (e.g. via E-Mail) Producers see the conditions of the offer made by the consumer. ' +
        'They can approve/ignore/reject the offer. ' +
        'If they accept the offer, they grant permission to the consumer to read the specified data from the host’s database and receive the defined compensation. </p>',
        actionContent: $('#html-current-deal').html() + UI.getConfirmConsentForm() + UI.getNextButton(),
    },
    5: {
        figure: '05_data-transfer.svg',
        title: 'Data Request',
        acteur: ["Consumer"],
        htmlContent: '<p>ON- and OFF-CHAIN</p>\
    <p>The consumer decides when to stop the offer and locks the contract. Once the offer is finished, the consumer can call the host’s API and read the data from the producers who granted access.</p>',
        actionContent: $('#html-current-deal').html() + UI.getDealActionBtn('btn-deal-lock', "Lock Deal", "App.lockDealRequest()")
    },
    6: {
        figure: '05_data-transfer.svg',
        title: 'Data Verification & Transfer',
        acteur: ["Consumer", "Host"],
        htmlContent: '<p>ON- and OFF-CHAIN</p>\
    <p>The host verifies the validity of the deal. Then, the data flows outside of the blockchain.  The API only sends the data from the producer’s who granted permission through the blockchain. </p>',
        actionContent: $('#html-current-deal').html() + UI.getDealActionBtn("btn-verify-deal", "Verify Deal", "App.verifyDealRequest()") + UI.getNextButton(),
    },
    7: {
        figure: '08_payments.png',
        title: 'Payment',
        acteur: ["Consumer"],
        htmlContent: '<p>ON-CHAIN</p>\
    <p>Once the consumer receives the data, they must release the payment to host and producers, in order for the hold out ot be refunded.</p>',
        actionContent: $('#html-current-deal').html() + UI.getDealActionBtn("btn-confirm-deal-received", "Confirm Completion", "App.confirmDealReceivedRequest()"),
    }
};


// TODO: put this outside of here
for (var i = 0; i < 8; i++) {
    WF.addStep(i, STEPS[i]);
}
