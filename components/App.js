import React, { Component, PropTypes } from 'react'
import {connect }from 'react-redux'
import {LOGIN, LOGOUT} from '../actions'

function App({login, logout, name, friends}){
  return (
    <div>
      <span>user:{name}</span>
      <div>friends: {friends.map(f=><span>{f.name}</span>)}</div>
      <button onClick={login}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

class Apps extends React.Component{
  componentDidMount(){
    this.props.login()
  }
  render(){
    return <App {...this.props} />
  }
}

export default connect( x=>x, dispatch => ({
  login: ()=> dispatch({type:LOGIN}),
  logout: ()=> dispatch({type:LOGOUT})
}))(Apps)
