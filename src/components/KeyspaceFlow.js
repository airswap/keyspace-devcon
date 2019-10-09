import React from "react";
import styled from "styled-components"
import KeySpace from "../lib/keyspace";
import { ethers } from "ethers";
import { Heading, Paragraph, Box, Accordion, AccordionPanel, Text } from "grommet";
import { formatErrorMessage, storeSignedSeedForAddress, getSignedSeedForAddress } from '../utils'
import Button from './Button'
import Messenger from './Messenger'

const getSigner = () => (new ethers.providers.Web3Provider(window.ethereum).getSigner());

let signer;
let keySpace;

const messageToSign = "test meeeee";

const MessengerHoldScreen = () => <Paragraph>Initialize Keyspace to use IPFS pubsub chat</Paragraph>

const AccordianElement = ({ content, label }) => <Box>
    <Box overflow="scroll">
      <Paragraph size="small">{label}</Paragraph>
    </Box>
    <Box pad="small" background="light-2" overflow="scroll">
      <Text size="xsmall">
        {
          content
        }
      </Text>
    </Box>
</Box>

const Container = styled(Box)`
  min-height: 100vh;
`
const AuthButton = styled(Button)`
  //background: #2b71ff;
  display: inline-block;
  //color: white;
  padding: 10px;
  border-radius: 40px;
  width: auto;
  text-align: center;
`;


class App extends React.Component {
  state = {
    stage: "initial",
    unsignedSeed: "I'm generating my KeySpace PGP key encryption password"
  };
  componentDidMount(){
    window.web3.eth.getAccounts((err, accounts) => {
      const [address] = accounts
      if(address && getSignedSeedForAddress(address.toLowerCase())) {
        this.init()
      }
    })
  }
  async init() {
    await window.ethereum.enable();
    this.setState({ stage: 'web3Enabled' })
    signer = getSigner()
    const walletAddress = (await signer.getAddress()).toLowerCase();
    this.setState({ walletAddress })
    const signedSeed = getSignedSeedForAddress(walletAddress);
    keySpace = new KeySpace({
      signer,
      signedSeed,
      seed: this.state.unsignedSeed,
      onRequestSignedSeed: (unsignedSeed) => {
        this.setState({
          unsignedSeed,
          stage: 'waitingForSeedSignature'
        })
      },
      onGeneratedSignedSeed: (signedSeed) => {
        storeSignedSeedForAddress({ signedSeed, address: walletAddress });
        this.setState({
          signedSeed,
          stage: 'seedSigned'
        })
      },
      onRequestPGPKeyPair: (pgpKeyPairAccount) => {
        this.setState({
          stage: 'waitingPGPPairSignature'
        })
      },
      onGeneratedPGPKeyPair: (pgpKey) => {
        this.setState({
          stage: 'pgpPairGenerated',
          pgpKey,
        })
      },
    });
    try {
      await keySpace.setUpPGP();
    } catch (initializationError) {
      this.setState({
        stage: 'keyspaceInitializationError',
        initializationError
      })
      return
    }
  }
  renderUnsignedSeed(){
    const { unsignedSeed } = this.state
    if(!unsignedSeed) {
      return null
    } else {
      return <AccordianElement label="Unsigned Seed" content={unsignedSeed} />
    }
  }
  renderSignedSeed(){
    const { signedSeed } = this.state
    if(!signedSeed) {
      return null
    } else {
      return <AccordianElement label="Signed Seed (PGP key encryption password)" content={signedSeed} />
    }
  }
  renderPGPKey(){
    const { pgpKey } = this.state
    if(!pgpKey) {
      return null
    } else {
      return <>
        <AccordianElement label="PGP Public Key" content={ pgpKey.public
          .split('\\r\\n')
          .map((item, key) => {
            return <span key={key}>{item}<br/></span>
          })
        } />
        <AccordianElement label="PGP Private Key" content={ pgpKey.private
          .split('\\r\\n')
          .map((item, key) => {
            return <span key={key}>{item}<br/></span>
          })
        } />
      </>
    }
  }
  render() {
    const { stage, initializationError, walletAddress } = this.state
    let content
    if(stage === 'initial') {
      content = <AuthButton onClick={() => this.init()} label="Connect To Metamask" />
    }
    if (stage === 'web3Enabled') {
      content = <Text>Initializing KeySpace</Text>
    }
    if (stage === 'waitingForSeedSignature') {
      content = <Text>Initializing KeySpace, Sign to create your seed</Text>
    }
    if (stage === 'waitingPGPPairSignature') {
      content = <Text>Sign your generated PGP key pair to authenticate it</Text>
    }
    if (stage === 'pgpPairGenerated') {
      content = <Text>KeySpace is ready</Text>
    }
    if(stage === 'keyspaceInitializationError') {
      content = <Box>
          <Text>{`Keyspace Initialization Error: ${formatErrorMessage(initializationError)}`}</Text>
          <AuthButton onClick={() => this.init()} label="Retry" />
        </Box>
    }
    return <Box>
        <Box pad="large" direction="row" alignContent="stretch" border={{
          "color": "brand",
          "size": "small",
          "side": "bottom"
        }}>
          <Box flex={{ grow: 1 }} direction="row">
            <Text size="xlarge">KeySpace Devcon5 Demo</Text>
          </Box>
          <Box direction="row">
            {
              content
            }
          </Box>
        </Box>
        <Container direction="row" fill="horizontal" pad="medium">
        <Box width="100%">
          {
            stage === 'pgpPairGenerated' ?
              <Messenger address={walletAddress} keySpace={keySpace} /> :
              <MessengerHoldScreen />
          }
        </Box>
        {/*<Box width="30%">*/}
        {/*{ content }*/}
        {/*{ this.renderUnsignedSeed() }*/}
        {/*{ this.renderSignedSeed() }*/}
        {/*{ this.renderPGPKey() }*/}
        {/*</Box>*/}
      </Container>
    </Box>;
  }
}

export default App;
