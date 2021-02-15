import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import  MyTable from './MyTable';

export class Layout extends Component {
  static displayName = Layout.name;

  render () {
    return (
        <MyTable/>
    );
  }
}
