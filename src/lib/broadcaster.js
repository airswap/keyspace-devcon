import IPFS from 'ipfs'

const myTopic = "QmXG8yk8UJjMT6qtE2zSxzz3U7z5jSYRgVWLCUFqAVnByM";

class PubSubBroadcaster {
  constructor(onReady, onNewMessage) {
    this.node = new IPFS({
      // this is the indexDB location of the data we receive on the node
      repo: "./ipfs",
      // pubsub is required for sending pubsub messages
      EXPERIMENTAL: { pubsub: true },
      // allow messages to be relayed through our node
      relay: { enabled: true, hop: { enabled: true, active: true } },
      config: {
        Addresses: {
          // makes us discoverable to all nodes on the network
          Swarm: [
            "/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"
          ]
        }
      }
    });
    this.node.on("ready", this._init.bind(this));
    this.onNewMessage = onNewMessage;
    this.onReady = onReady
  }

  async _init() {
    await this.node.pubsub.subscribe(
      myTopic,
      this.handleMessageReceived.bind(this)
    );

    this.node.libp2p.on("peer:connect", this.handlePeerConnected.bind(this));

    this.onReady();
  }
  handleMessageReceived(msg) {
    const messageData = msg.data.toString();
    this.onNewMessage(messageData);
    console.log("msg received", messageData);
  }
  async getIPFSSwarmPeers() {
    return this.node.swarm.peers();
  }
  async connectToPeer(multiaddr, protocol = "/p2p-circuit/ipfs/") {
    try {
      await this.node.swarm.connect(`${protocol}${multiaddr}`);
    } catch (e) {
      debugger;
      throw e;
    }
  }
  handlePeerConnected(ipfsPeer) {
    const ipfsId = ipfsPeer.id.toB58String();
    // console.log("peer connected", ipfsId);
  }
  async sendMessage(message, topic = myTopic) {
    try {
      const msgString = JSON.stringify(message);
      const messageBuffer = IPFS.Buffer(msgString);
      await this.node.pubsub.publish(topic, messageBuffer);
    } catch (e) {
      throw e;
    }
  }
}

export default PubSubBroadcaster;
