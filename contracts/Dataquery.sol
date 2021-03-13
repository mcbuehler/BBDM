pragma solidity ^0.5.0;

contract Dataquery {
  // maps deal ids to deals
  mapping(uint => Deal) public deals;
  // indicator mapping to check whether a deal for a given id exists
  mapping(uint => bool) public dealIds;

  uint public dealCount;

  // The bank handles value transfers
  Bank bank;

  // holdout ratio in percent
  uint8 alpha = 50;

  // Number of wei in one ether
  uint WEI_PER_ETHER = 1000000000000000000;
  uint averageTransactionFee = WEI_PER_ETHER / 10;  // in wey.

  // The DealState indicates what the a client is allowed to do with a deal
  enum DealState {CREATED, CONFIRMED, LOCKED, COMPLETED}
  // Consent state for producers
  enum Consent {NA, GRANTED}

  struct Deal{
    address consumer;
    address payable host;
    address[] producers;  // All producers
    address payable[] producersWithConsent;  // Producers that have given their consent
    mapping(address => Consent) producerConsent;
    mapping(address => uint) gasConsumed;  // Keeps track of how much acteurs spent on transaction fees
    uint deposit;
    uint pricePerProducer;
    uint8 producerShare;
    string password;
    DealState state;
  }

    /*
  constructor(address payable bankAddress) public{
      bank = Bank(bankAddress);
      dealCount = 0;
    }

    */
    constructor() public{
        bank = new Bank();
        dealCount = 0;
      }
  function createDeal(
    uint _dealId,
    address payable[] memory _producers,
    address payable _host,
    uint _deposit,
    uint _pricePerProducer,  // in wei
    uint8 _producerShare,  // share that the producer should get in percent
    string memory _passwordEncrypted) public payable returns (uint) {
      /*
      Initiates a new deal on the blockchain. The status of this deal will
      be CREATED.
      Make sure to send enough wei when calling this function.


      _producers: a list of producer addresses that will be asked for permission
      _host: address of data host
      _deposit: Amount of wei that will be the deposit
      _pricePerProducer: Amount of wei that each producer gets
      _passwordEncrypted: The encrypted password for the deal
      */
      uint depositCalculated = calculateDeposit(_producers.length, _pricePerProducer);
      require (_dealId == dealCount);
      require(_deposit >= depositCalculated);
      require(msg.value >= _deposit);
      require(_deposit > 0);
      require(_pricePerProducer >= 0);
      require(_producerShare >= 0);
      require(_producerShare <= 100);

      dealIds[_dealId] = true;
      dealCount ++;

      address payable bankAddress = bank.getAddressPayable();
      // Here we send the money
      bankAddress.transfer(msg.value);
      // He we assign the sent money to the corresponding account and deal
      bank.deposit(msg.sender, _dealId, _deposit);

      Deal storage deal = deals[_dealId];
      deal.consumer = msg.sender;
      deal.host = _host;
      deal.producers = _producers;
      deal.deposit = _deposit;
      deal.pricePerProducer =  _pricePerProducer;
      deal.producerShare = _producerShare;
      deal.password = _passwordEncrypted;
      deal.state = DealState.CREATED;
      // The first time we push an element into the array we pay extra gas.
      // This cost should not be on the shoulder of the producers so we
      // push one element and remove it again straight away in order to
      // initialise the array.
      //deal.producersWithConsent.push(msg.sender);
      //delete deal.producersWithConsent[0];
      //deal.producersWithConsent.length = 0;

      uint producerCount = _producers.length;
      for(uint i=0; i<producerCount; i++){
        deal.producerConsent[_producers[i]] = Consent.NA;
      }
      emit onDealCreated(_dealId, _deposit);
      return _dealId;
    }

  function confirmDeal(uint _dealId) public {
    /*
    Confirm the deal with the given _dealId. Called by the host.
    The deal status will change to CONFIRMED.
    */
      uint256 initialGas = gasleft();
      requireDealExists(_dealId);
      Deal storage deal = deals[_dealId];
      // Only the host should be able to confirm the contract
      require(deal.host == msg.sender);
      require(deal.state == DealState.CREATED);
      // If we get here we are fine
      deals[_dealId].state = DealState.CONFIRMED;
      emit onDealConfirmed(_dealId);

      // We keep track of how much gas the host spent such that we can pay
      // back later.
      deal.gasConsumed[msg.sender] += initialGas - gasleft();
    }

    function confirmConsent(uint _dealId) public {
      /*
      Confirm the consent for the deal.
      The producerConsent for the smsg.ender will change to GRANTED.
      Called by a producer.
      */
      uint256 initialGas = gasleft();
      requireDealExists(_dealId);
      Deal storage deal = deals[_dealId];
      // The deal is in the correct state
      require(deal.state == DealState.CONFIRMED);
      // Make sure we know the producer
      require(deal.producerConsent[msg.sender] == Consent.NA);
      // If we get here we are fine

      deal.producerConsent[msg.sender] = Consent.GRANTED;
      deal.producersWithConsent.push(msg.sender);
      emit onDealConsentGranted(_dealId, msg.sender);
      // We keep track of how much gas the host spent such that we can pay
      // back later.
      deal.gasConsumed[msg.sender] += initialGas - gasleft();
    }

    function estimatePrice(uint _dealId) public view returns (uint){
      /*
      Estimate the price of a deal based on the number of producers with
      consent and the price per Producer.
      Anybody cann call this function.
      */
      requireDealExists(_dealId);
      Deal memory deal = deals[_dealId];
      uint price = deal.producersWithConsent.length * deal.pricePerProducer;
      return price;
    }

    function lockDeal(uint _dealId) public payable {
      /*
      Lock a deal. Make sure to send enough wei with this transaktion in
      order to pay for the deal.
      The deal state will change to LOCKED.
      Called by a consumer.
      */
      requireDealExists(_dealId);
      Deal storage deal = deals[_dealId];
      require(deal.state == DealState.CONFIRMED);
      // Only the consumer can lock the deal
      require(deal.consumer == msg.sender);

      // Count producers with consent
      uint price = estimatePrice(_dealId);

      require(msg.value >= price);  // or should we here check equality?
      address payable bankAddress = bank.getAddressPayable();
      bankAddress.transfer(msg.value);
      bank.deposit(msg.sender, _dealId, msg.value);

      deal.state = DealState.LOCKED;
      emit onDealLocked(_dealId, deal.producersWithConsent.length, msg.value);
    }

    function getDealPassword(uint _dealId) public view returns (string memory){
      /*
      Returns the encrypted password for a deal.
      Anybody can call this function.
      */
      requireDealExists(_dealId);
      Deal memory d = deals[_dealId];
      return (
        d.password
        );
    }

    function confirmDealReceived(uint _dealId) public {
      /*
      Confirms the completion of the deal.
      The deal status will change to COMPLETED.
      Called by the consumer.
      */
      requireDealExists(_dealId);
      Deal storage deal = deals[_dealId];
      require(deal.state == DealState.LOCKED);
      // Only the consumer can confirm
      require(deal.consumer == msg.sender);

      // Pay everyone out
      uint payoutPerUser = deal.pricePerProducer * deal.producerShare / 100;


      uint paidProducers = 0;
      uint initialBalance = bank.getBalance(msg.sender, _dealId);

      // Pay out producers
      for(uint i=0; i<deal.producersWithConsent.length; i++){
        // We add the amount of gas that the producers spent previously
        uint toPay = payoutPerUser + deal.gasConsumed[deal.producersWithConsent[i]];
         bank.transferToReceiver(msg.sender, toPay, _dealId, deal.producersWithConsent[i]);
         paidProducers += toPay;
      }

      // Pay out host
      uint toPayHost = deal.producersWithConsent.length * deal.pricePerProducer * (100 - deal.producerShare) / 100 + deal.gasConsumed[deal.host];
      bank.transferToReceiver(msg.sender, toPayHost, _dealId, deal.host);
      // Pay back deposit
      //bank.withdrawAll(msg.sender, _dealId);
      deal.state = DealState.COMPLETED;
      emit onConfirmDealReceived(_dealId, paidProducers, toPayHost, initialBalance - toPayHost - paidProducers);
    }

    event onDealCreated(uint _dealId, uint _depositPaid);
    event onDealCreationFailed(string _message);

    event onDealConfirmed(uint _dealId);
    event onDealConfimationFailed(uint _dealId, string _message);

    event onDealConsentGranted(uint _dealId, address _producer);

    event onDealLocked(uint _dealId, uint _numberOfConsentingProducers, uint _pricePaid);

    event onDealVerificationFailed();

    event onConfirmDealReceived(uint _dealId, uint _paidProducers, uint _paidHost, uint _payback);


      event onEstimatePrice(uint _price);

    function getDeal(uint _dealId) public view returns (address payable host, address[] memory producers, DealState status, address payable[] memory producersWithConsent, uint pricePerProducer){
      requireDealExists(_dealId);
      Deal memory d = deals[_dealId];
      return (
        d.host,
        d.producers,
        d.state,
        d.producersWithConsent,
        d.pricePerProducer
        );
    }

    function getDealStatus(uint _dealId) public view returns (DealState){
      requireDealExists(_dealId);
      Deal memory d = deals[_dealId];
      return (
        d.state
        );
    }

    function getBalance(address _account, uint _dealId) public view returns (uint balance){
      requireDealExists(_dealId);
      return bank.getBalance(_account, _dealId);
    }

    function toAddress(address payable addr) private pure returns (address){
      return address(uint160(addr));
    }

    function requireDealExists(uint _dealId) private view {
      require(dealIds[_dealId]);
      require(_dealId < dealCount);
    }

    function calculateDeposit(uint numberUsers, uint pricePerProducer) public view returns (uint){
      /*
      Calculates the deposit required for a deal. The deposit includes
      a holdout (the actual deposit) as well as a reserve for the
      transaction fees of the producers.
      */
      uint countTransactions = (numberUsers + 1);  // +1 because the host makes 1 writing transaction
      uint holdout = numberUsers * pricePerProducer * alpha / 100;
      return countTransactions * averageTransactionFee + holdout;
    }

    function getBankAddress() public view returns (address){
      return address(bank);
    }
  }

  contract Bank {

    struct Account{
      // maps dealIds to balance
      mapping(uint => uint) deals;
    }

    mapping(address => Account) private accounts;   // balances, indexed by addresses

    function getBalance(address _addr, uint _dealId) public view returns (uint){
      return accounts[_addr].deals[_dealId];
    }

    function deposit(address _addr, uint _dealId, uint _value) public {
      /*
      Deposit a _value for a specific msg.sender and _dealId.
      This function does not actually receive any wei. Make sure to
      call address.transfer with the correct amount in order to
      avoid inconsistencies.
      */
      accounts[_addr].deals[_dealId] += _value;     // adjust the account's balance
    }

    function transferToReceiver(address _sender, uint _amount, uint _dealId, address payable _receiver) public {
      /*
      Transfers the given _amount to _receiver. The amount is deducted
      from the msg.sender's account for the given _dealId.
      */
      require(_amount <= accounts[_sender].deals[_dealId]);
      accounts[_sender].deals[_dealId] -= _amount;
      _receiver.transfer(_amount);
    }

    function withdrawAll(address payable _from, uint _dealId) public {
      /*
      Pays back all the remaining wei for given _dealId to the msg.sender.
      */
      uint amount = accounts[_from].deals[_dealId];
      require(amount >= 0);
      accounts[_from].deals[_dealId] -= amount; // should yield 0 afterwards
      _from.transfer(amount);
    }

    function getAddressPayable() public view returns (address payable){
      /*
      Converts given address to an address payable.
      */
      address payable addr = address(uint160(address(this)));
      return addr;
    }

   function() external payable{
  }
  }
