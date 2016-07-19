import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import App from './components/App'
import reducer from './reducers'
import connect from './lib/reduxEnhancer'
import {Provider} from 'react-redux'

import {LOGIN, LOGOUT} from './actions'

const store = createStore(reducer, connect([LOGIN, LOGOUT]))
const rootEl = document.getElementById('root')

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <App
        value={store.getState()}
        onIncrement={() => store.dispatch({ type: 'INCREMENT' })}
        onDecrement={() => store.dispatch({ type: 'DECREMENT' })}
      />
    </Provider>
    ,rootEl
  )
}

render()
store.subscribe(render)
