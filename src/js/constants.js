// Rinkeby Constants
var Constants = {
    WEBSOCKET_PROVIDER: "wss://rinkeby.infura.io/ws/v3/<PLACEHOLDER>",
    ETHERSCAN_URL: "https://rinkeby.etherscan.io/tx/",
    DEAL_ADDRESS: "0xfae99B809D2B1fC28c41F48B2b3DD077971E66BE", //"0xCd63d2B7DcF172497Ff5242E55dEC350131CD2a9",
    BANK_ADDRESS: "0x49d47574A6b138E926Dc1f3203E54D24aD211A6d",
    ETHER: 1000000000000000000,
    // Important: DEALSTATES must match with eum in smart contract
    DEALSTATES: ["CREATED", "CONFIRMED", "LOCKED", "COMPLETED"],
    HOST: {
        ADDRESS: "0x5e693578d67152028beb082ee164c7b13f8cf1d6",
        PK: <PLACEHOLDER>,
        PUBLIC_KEY: <PLACEHOLDER>,
        PRIVATE_KEY: <PLACEHOLDER>
    },
    CONSUMER: {ADDRESS: "0x1e2183293cb1b7f70657d6bf223a5e91dcd45e01", PK: <PLACEHOLDER>},
    PRODUCERS: [
        {ADDRESS: "0x810ef50F6014c3AA5BF4370b4aD6fCb58E7aFe62", PK:<PLACEHOLDER>},
        {ADDRESS: "0x804b1701559F27eC2a0311a32FB520D268197eb5", PK:<PLACEHOLDER>},
        {ADDRESS: "0xAC320c46240Bd63f64160426FcD25C73C13904D4", PK:<PLACEHOLDER>},
    ],
    ADMIN:  {ADDRESS: "0x51ca34dc7ea75c149c4f9230dd2c25f099178b9a", PK:<PLACEHOLDER>}
};
