import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import { Div, Button, Icon, Row, Col, Container, Tag, ThemeProvider, Anchor, Text, Image, Input } from "atomize";

const HRSM_Center = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' };
const HRSM_IMG_Center = { display: 'flex', justifyContent: 'center', alignItems: 'center' };

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

const mintLimit = 3;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click BUY to mint your NFTs. There is a limit of ` + mintLimit + ` per wallet address.`);
  const [mintAmount, setMintAmount] = useState(1);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Almost there! Minting "${CONFIG.NFT_NAME}" now...`);
    setClaimingNft(true);
    blockchain.smartContract.methods
      .mint(mintAmount)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong. Are you connected to the Polygon Mainnet? Please check your wallet settings and try again.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `You have successfully minted ${CONFIG.NFT_NAME}! Go visit Opensea.io to view it.`
        );
        setClaimingNft(false);
        dispatch(fetchData(blockchain.account));
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > mintLimit) {
      newMintAmount = mintLimit;
    }
    setMintAmount(newMintAmount);
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <Container>

      <Div style={HRSM_Center}>

        <Row>

          <Col size={{ xs: 12, lg: 6 }} bg="black">

            <Div p="2rem">

              <Row>
                <Col size={{ xs: 2, lg: 4 }}></Col>
                <Col size={{ xs: 8, lg: 4 }}>
                  <Image alt={"logo"} src={"/config/images/Horsemen-Logo-256.png"} />
                </Col>
                <Col size={{ xs: 2, lg: 4 }}></Col>
              </Row>

              <Div shadow="1" w="100%" bg="white" rounded="md" p="1rem">

                <Text textAlign="center" textWeight="800">
                  You are minting
                </Text>
                <Text textAlign="center" textSize="heading" textWeight="800">
                  Oya the Catalyst
                </Text>

                {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
                  <>
                    <Text textAlign="center">
                      The sale has ended.
                    </Text>
                    <Text textAlign="center">
                      You can still find {CONFIG.NFT_NAME} on
                      <Anchor target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                        {CONFIG.MARKETPLACE}
                      </Anchor>
                    </Text>
                  </>
                ) : (
                  <>
                    <Text textAlign="center" p="1rem">
                      1 {CONFIG.SYMBOL} costs {CONFIG.DISPLAY_COST}{" "}
                      {CONFIG.NETWORK.SYMBOL}, excluding gas fees*, and will
                      be minted directly to OpenSea.
                    </Text>

                    {blockchain.account === "" ||
                      blockchain.smartContract === null ? (
                      <Container>
                        <Text textAlign="center">
                          <Tag bg="gray300">
                            Connect to the {CONFIG.NETWORK.NAME} network
                          </Tag>
                        </Text>

                        <Div style={HRSM_IMG_Center}>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              dispatch(connect());
                              getData();
                            }}
                            prefix={
                              <Icon name="Card" size="16px" color="white" m={{ r: "0.5rem" }} />
                            }
                            bg="warning800"
                            hoverBg="success700"
                            rounded="md"
                            p={{ r: "1.5rem", l: "1rem" }}
                            m='1rem'
                            shadow="3"
                            hoverShadow="4"
                          >
                            Connect Wallet
                          </Button>
                        </Div>

                        {blockchain.errorMsg !== "" ? (
                          <Text textAlign="center">
                            <Tag bg="warning700">
                              {blockchain.errorMsg}
                            </Tag>
                          </Text>
                        ) : null}

                      </Container>
                    ) : (

                      <Div shadow="3" w="100%" bg="white" rounded="md" align="center" p="1rem" border="1px solid" borderColor="gray300">

                        <Text textAlign="center">
                          <Tag>
                            {feedback}
                          </Tag>
                        </Text>
                        <br />
                        <Row>
                          <Col size={{ xs: 6, lg: 4 }} d="flex">

                            <Button
                              bg="success700"
                              hoverBg="warning800"
                              rounded="md"
                              w="50%"
                              m={{ r: "0.5rem" }}
                              disabled={claimingNft ? 1 : 0}
                              onClick={(e) => {
                                e.preventDefault();
                                decrementMintAmount();
                              }}
                            >
                              -
                            </Button>
                            <Button
                              bg="success700"
                              hoverBg="warning800"
                              rounded="md"
                              w="50%"
                              disabled={claimingNft ? 1 : 0}
                              onClick={(e) => {
                                e.preventDefault();
                                incrementMintAmount();
                              }}
                            >
                              +
                            </Button>

                          </Col>
                          <Col
                            size={{ xs: 2, lg: 4 }}
                            bg="gray300"
                          >

                            <Text textAlign="center" textSize="subheader" style={HRSM_Center}>
                              {mintAmount}
                            </Text>

                          </Col>
                          <Col size={{ xs: 4, lg: 4 }}>

                            <Button
                              bg="success700"
                              hoverBg="warning800"
                              rounded="md"
                              w="100%"
                              disabled={claimingNft ? 1 : 0}
                              onClick={(e) => {
                                e.preventDefault();
                                claimNFTs();
                                getData();
                              }}
                            >
                              {claimingNft ? "BUSY" : "BUY"}
                            </Button>

                          </Col>
                        </Row>

                      </Div>
                    )}
                  </>
                )}
              </Div>
              <br />

              <Row>
                {/* <Col size={{ xs: 12, lg: 2 }}>
                  <Div shadow="1" w="100%" bg="white" rounded="md" p="0.25rem">
                    <Tag>
                      {data.totalSupply} / {CONFIG.MAX_SUPPLY}
                    </Tag>
                  </Div>
                </Col> */}
                <Col size={{ xs: 5, lg: 3 }}>
                  <Div shadow="1" w="100%" bg="white" rounded="md" d="flex" align="center" p="0.5rem">
                    <Tag>
                      <Anchor target={"_blank"} href={CONFIG.SCAN_LINK}>
                        {truncate(CONFIG.CONTRACT_ADDRESS, 10)}
                      </Anchor>
                    </Tag>
                  </Div>
                </Col>
                <Col size={{ xs: 1, lg: 3 }}></Col>
                <Col size={{ xs: 3, lg: 3 }} style={HRSM_IMG_Center}>

                  <Image alt={"logo"} src={"/config/images/polygon-logo-inverted.png"} />

                </Col>
                <Col size={{ xs: 3, lg: 3 }} style={HRSM_IMG_Center}>

                  <Image alt={"logo"} src={"/config/images/opensea-logo.png"} />

                </Col>
              </Row>

            </Div>

            <Div p="2rem">
              <Text textColor="white" textSize="tiny">
                <sup>*</sup> Make sure you are connected to the right network (
                <Tag bg="dark">{CONFIG.NETWORK.NAME} </Tag>) and the correct address. We have set the gas limit
                to <Tag bg="dark">{CONFIG.GAS_LIMIT}</Tag> for the contract to
                successfully mint your NFT. We recommend that you don't lower the gas limit. Please note:
                Once you make the purchase, you cannot undo this action.
              </Text>
            </Div>

          </Col>

          <Col
            size={{ xs: 12, lg: 6 }}
            minH="40rem"
            bg="gray700"
            bgImg="/config/images/covers/bkg-halftone-dark2.jpg"
            bgSize="cover"
          >
            <Div style={HRSM_Center}>

              <Row>
                <Col size={{ xs: 1, lg: 3 }}></Col>
                <Col size={{ xs: 10, lg: 6 }}>
                  <Image alt={"example"} src={"/config/images/proofs/oya-variants-3_Rare.jpg"} />
                </Col>
                <Col size={{ xs: 1, lg: 3 }}></Col>
              </Row>



            </Div>

          </Col>

        </Row>
      </Div>
    </Container>
  );
}

export default App;
