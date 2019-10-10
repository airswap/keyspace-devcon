import _ from 'lodash'
import styled from 'styled-components'
import React from "react";
import mobile from 'is-mobile'
import { Heading, Text, Paragraph, TextInput, Tabs, Tab, Box, Anchor, Accordion, AccordionPanel, CheckBox } from "grommet";
import Broadcaster from "../lib/broadcaster";
import Button from './Button'
// window.setInterval(() => {
//   debugger;
//   broadcaster.sendMessage("hello ya");
// }, 1000);

const makeIntroduction = ({ from, nickname }) => ({
  type: 'introduction',
  from,
  nickname,
})

const requestIntroductions = ({ from }) => ({
  type: 'requestIntroductions',
  from,
})

const makeMessage = ({ message, from, to }) => ({
  type: 'message',
  from,
  to,
  message
})

const MessageBody = styled(Box)`
  border-radius: 15px;
  padding: 0 15px;
  overflow: hidden;
`

const MessageContainer = styled(Box)`
  margin-bottom: 10px;
`

const MessageFrom = styled(Anchor)`
  margin: 0 13px;
`
const Arrow = styled(Text)`
    position: relative;
    top: -3px;
`

const Message = ({ from, to, message, nicknames }) => <MessageContainer>
  <Box direction="row">
  <MessageFrom target="_blank" size="xsmall" href={`https://rinkeby.etherscan.io/address/${from}`} primary label={nicknames[from] || from} />
  {
    to ?
      <><Arrow>→</Arrow> <MessageFrom size="xsmall" href={`https://rinkeby.etherscan.io/address/${to}`} primary label={nicknames[to] || to} /></> : null
  }
  </Box>
  <MessageBody background="light-3">
    <Paragraph size="small">
      {message}
    </Paragraph>
  </MessageBody>
</MessageContainer>

const Container = styled(Box)`
  height: calc(100vh - 200px);
  //position: absolute;
`

const MessageBox = styled(Box)`
  //height: calc(100vh - 182px)
`

const MessagesContainer = styled(Box)`
  margin-bottom: 300px;
`

const ControlsContainer = styled(Box)`
 position: fixed;
 left: 0px;
 bottom: 0px;
 width: 100vw;
 background: white;
 padding: 5px 20px 20px 20px;
`

const PeerCheck = styled(CheckBox)`
 margin-bottom: 5px;
`

class Messenger extends React.Component {
  state = {
    peers: [],
    selectedPeers: [],
    messages: [],
    myMessages: [],
    newMessage: ``,
    nicknames: {},
    discoveryMessages: []
  };
  componentWillUnmount() {
    debugger
  }

  componentDidMount() {
    const { address } = this.props
    this.broadcaster = new Broadcaster(
      () => {
        this.broadcaster.sendMessage(requestIntroductions({ from: address }))
        window.setTimeout(
          () => this.broadcaster.sendMessage(requestIntroductions({ from: address })),
          5000
        )

        window.setTimeout(
          () => this.broadcaster.sendMessage(requestIntroductions({ from: address })),
          10000
        )

        window.setTimeout(
          () => this.broadcaster.sendMessage(requestIntroductions({ from: address })),
          15000
        )

        window.setInterval(
          () => this.broadcaster.sendMessage(requestIntroductions({ from: address })),
          60000
        )
      },
      msg => {
        const message = JSON.parse(msg)
        if(message.type === 'requestIntroductions') {
          this.broadcaster.sendMessage(makeIntroduction({ from: address, nickname: this.state.nicknames[address] }))
          this.setState({ discoveryMessages: [...this.state.discoveryMessages, message] });
          return
        } else if(message.type === 'introduction') {
          this.addIntroduction(message.from)
          if(message.nickname) {
            this.setState({
              nicknames: {
                [message.from]: message.nickname,
                ...this.state.nicknames
              }
            })
          }
          this.setState({ discoveryMessages: [...this.state.discoveryMessages, message] });
          return
        } else if(message.type === 'message' && message.to === address) {
          this.decryptMessage(message)
        }

      this.setState({ messages: [...this.state.messages, message] });
    });
  }
  addIntroduction(address){
    const { peers, selectedPeers } = this.state

    if(!_.includes(peers, address.toLowerCase())) {
      this.setState({
        selectedPeers: [...selectedPeers, address.toLowerCase()],
      })
    }

    const newPeers = _.uniq([...peers, address.toLowerCase()])
    this.setState({ peers: newPeers })
  }
  async decryptMessage({ from, message }){
    const { keySpace } = this.props
    const { myMessages } = this.state
    const decryptedMessage = await keySpace.decrypt(
      message,
      from.toLowerCase()
    );
    const newMessage = {
      from,
      message: decryptedMessage,
    }
    const newMessages = [...myMessages, newMessage]

    this.setState({
      myMessages: newMessages
    })
  }
  sendMessage() {
    const { selectedPeers, newMessage } = this.state
    const { keySpace, address } = this.props
    selectedPeers.map(async peerAddress => {
      const encryptedMessage = await keySpace.encrypt(
        newMessage,
        peerAddress.toLowerCase()
      );
      this.broadcaster.sendMessage(makeMessage({
        from: address,
        to: peerAddress.toLowerCase(),
        message: encryptedMessage
      }))
    })
    this.setState({ newMessage: "" });
  }
  togglePeerInclusion(address) {
    const { selectedPeers } = this.state
    if(_.includes(selectedPeers, address)) {
      this.setState({ selectedPeers: _.without(selectedPeers, address) })
    } else {
      this.setState({ selectedPeers: [...selectedPeers, address] })
    }
  }
  renderMessages() {
    const { messages, myMessages, discoveryMessages, nicknames } = this.state;

    return <MessagesContainer fill="horizontal" flex={{ grow: 1 }}>
      <Tabs>
      <Tab title={ mobile() ? `Chat (${myMessages.length})` : `My Decrypted Chat (${myMessages.length})` }>
        <MessageBox pad="medium" overflow="scroll">
          {myMessages.map(({ from, message }) => <Message {...{ from, message }} nicknames={nicknames} />)}
        </MessageBox>
      </Tab>
      <Tab title={ mobile() ? `PubSub (${messages.length})` : `Encrypted PubSub Stream (${messages.length})` }>
        <MessageBox pad="medium" overflow="scroll">
           {messages.map(({ from, to, message }) => <Message {...{ from, to, message }} nicknames={nicknames} />)}
        </MessageBox>
      </Tab>
      <Tab title={ mobile() ? `Peer (${discoveryMessages.length})` : `Peer Discovery Protocol (${discoveryMessages.length})` }>
        <MessageBox pad="medium" overflow="scroll">
          {[...discoveryMessages].reverse().slice(0, 20).map(({ from, to, type, nickname }) => <Message {...{ from, to, message: `${type}${ nickname ? `, nickname: ${nickname}` : ''}` }} nicknames={nicknames} />)}
        </MessageBox>
      </Tab>
    </Tabs>
    </MessagesContainer>
  }
  setNickname() {
    const nickname = window.prompt('Please enter your nickname')
    const { address } = this.props
    this.broadcaster.sendMessage(makeIntroduction({ from: address, nickname }))
  }
  renderPeers(){
    const { address } = this.props
    const { peers, selectedPeers, nicknames } = this.state
    const label = mobile() ? `Peers (${peers.length}) Selected (${selectedPeers.length})` :
      `Known Peers (${peers.length}) Selected Peers (${selectedPeers.length})`

    return <Accordion>
      <AccordionPanel label={label}>
        <Box pad="small" background="light-2" overflow="scroll">
          {
            peers.map(peerAddress => {
              const peerLabel = nicknames[peerAddress] || peerAddress
             return <PeerCheck
               checked={_.includes(selectedPeers, peerAddress)}
               label={peerAddress === address ? <Text>{peerLabel} <Anchor label="Set Nickname" onClick={() => this.setNickname()} /></Text>  : <Text> {peerLabel} </Text>}
               disabled={peerAddress === address}
               onChange={() => this.togglePeerInclusion(peerAddress)}
             />
            })
          }
        </Box>
      </AccordionPanel>
    </Accordion>
  }
  render() {
    const { newMessage, peers } = this.state;
    return (
      <Container>
        {
          this.renderMessages()
        }
        <ControlsContainer>
          { this.renderPeers() }
          <TextInput
            placeholder="Send a message to the workshop's IPFS PubSub topic"
            value={newMessage}
            onChange={event =>
              this.setState({
                newMessage: event.target.value
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                this.sendMessage();
              }
            }}

          />
          <br/>
          <Button
            label="Send Message"
            onClick={() => {
              this.sendMessage();
            }}
          />
        </ControlsContainer>
      </Container>
    );
  }
}

export default Messenger;
