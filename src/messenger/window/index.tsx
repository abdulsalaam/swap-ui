import * as React from "react";
import { observer, inject } from "mobx-react";
import WindowsHeader from "./header";
import WindowsContent from "./content";
import WindowsInput from "./input";
import { IAppStore } from "src/interfaces/store";
require("./styles.scss");

interface IWindowProps {
  store?: {
    appStore: IAppStore;
  };
}

@inject("store")
@observer
export default class Window extends React.Component<IWindowProps> {
  constructor(props) {
    super(props);
  }
  public render() {
    if (!this.props.store.appStore.currentChat) {
      return (
        <div className="window">
          <div className="window__empty">Choose chat</div>
        </div>
      );
    }
    return(
      <div className="window">
        <WindowsHeader/>
        <WindowsContent/>
        <WindowsInput/>
      </div>
    );
    }
  }
