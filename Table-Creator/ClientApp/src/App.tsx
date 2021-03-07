import React, { Component } from 'react';
import MyTable from './components/MyTable';

import './custom.css';
import 'reflect-metadata';


export default class App extends Component {
  static displayName = App.name;

  render () {
    return (
      <MyTable/>
    );
  }
}
