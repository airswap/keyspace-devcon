import React from "react";
import ReactDOM from "react-dom";
import { Grommet } from "grommet";
// import Messenger from "./components/Messenger";
import KeyspaceFlow from "./components/KeyspaceFlow";
// window.setInterval(() => {
//   debugger;
//   broadcaster.sendMessage("hello ya");
// }, 1000);

const myTheme = {
  global: {
    font: {
      family: "Lato"
    }
  }
};

class App extends React.Component {
  render() {
    return (
      <Grommet full={true} theme={myTheme}>
        <KeyspaceFlow />
      </Grommet>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
