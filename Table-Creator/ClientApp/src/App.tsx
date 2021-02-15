import React, { Component } from 'react';
import MyTable from './components/MyTable';

import './custom.css'

export default class App extends Component {
  static displayName = App.name;

  render () {
    return (
      <MyTable/>
    );
  }
}
