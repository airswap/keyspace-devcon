import React from "react";
import styled from "styled-components"
import KeySpace from "../lib/keyspace";
import { ethers } from "ethers";
import { Heading, Paragraph, Box, Accordion, AccordionPanel, Text, DropButton } from "grommet";
import { formatErrorMessage, storeSignedSeedForAddress, getSignedSeedForAddress } from '../utils'
import Button from './Button'
import Messenger from './Messenger'
import mobile from 'is-mobile'


const getSigner = () => (new ethers.providers.Web3Provider(window.ethereum).getSigner());

let signer;
let keySpace;

const messageToSign = "test meeeee";

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

const AboutButton = styled(AuthButton)`
  position: absolute; 
  right: 0;
  padding: 4px 10px;
  top: ${ mobile() ? '-15px' : '-12px'};
`

const HeaderRightBox = styled(Box)`
  position: relative;
  padding-right: 50px
`

class App extends React.Component {
  state = {
    stage: "initial",
    unsignedSeed: "I'm generating my KeySpace PGP key encryption password"
  };
  componentDidMount(){
    window.web3 && window.web3.eth.getAccounts((err, accounts) => {
      const [address] = accounts
      if(address && getSignedSeedForAddress(address.toLowerCase())) {
        this.init()
      }
    })
  }
  async init(type = 'metamask') {

    if(type === 'metamask') {
      try {
        await window.ethereum.enable();
      } catch (e) {
        this.setState({
          stage: 'keyspaceInitializationError',
          initializationError: 'Web3 not detected'
        })
        return
      }
      this.setState({stage: 'web3Enabled'})
      signer = getSigner()
    } else if(type === 'newWallet') {
      this.setState({stage: 'web3Enabled'})
      signer = ethers.Wallet.createRandom()
    }
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
    let content = null
    let headerContent = null
    if(stage === 'initial') {
      content = <Box direction="row">
        <AuthButton margin="small" onClick={() => this.init('newWallet')} label="Generate Temporary Wallet" />

        <AuthButton margin="small" onClick={() => this.init('metamask')} label="Connect To Metamask" />
      </Box>
    }
    if (stage === 'web3Enabled') {
      content = <Text>Initializing KeySpace</Text>
    }
    if (stage === 'waitingForSeedSignature') {
      content = <Text>Initializing KeySpace, Sign to create your seed</Text>
    }
    if (stage === 'waitingPGPPairSignature') {
      content = <Text>Signing your generated PGP key pair to authenticate it</Text>
    }
    if (stage === 'pgpPairGenerated' && !mobile()) {
      headerContent = <DropButton
        label="KeySpace is ready"
        dropAlign={{ top: 'bottom', right: 'right' }}
        dropContent={
          <Box pad="medium" margin="medium" border={{
            "color": "brand",
            "size": "small",
            "side": "all"
          }}>
            <Box>
              <Text size="large">KeySpace Parameters</Text>
            </Box>
            { this.renderUnsignedSeed() }
            { this.renderSignedSeed() }
            { this.renderPGPKey() }
          </Box>
        }
      />
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
            <Text size={ mobile() ? 'medium' :  'xlarge' }>KeySpace Devcon5 Demo</Text>
          </Box>
          <HeaderRightBox direction="row">
            {
              headerContent
            }
            <AboutButton margin="small" onClick={() => window.open('https://github.com/airswap/keyspace-devcon', '_blank')} label="?" />
          </HeaderRightBox>
        </Box>
        <Container direction="row" fill="horizontal" pad="medium">
        <Box width="100%">
          {
            stage === 'pgpPairGenerated' ?
              <Messenger address={walletAddress} keySpace={keySpace} /> :
              <Box align="center">
                <Box margin="medium">
                  <Text>Connect a wallet and initialize Keyspace to use the IPFS pubsub chat.</Text>
                </Box>
                <Box margin="medium">
                  { content }
                </Box>
              </Box>
          }
        </Box>
      </Container>
    </Box>;
  }
}

export default App;
