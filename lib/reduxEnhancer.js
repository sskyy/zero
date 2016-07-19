import request from 'superagent';
const RESET_ACTION = '@@zero/reset'
import createMerge from 'deep-merge'

function isArray(obj){
  return Object.prototype.toString.call(obj) === '[object Array]'
}

const merge = createMerge(function(target, source, key){
  if( isArray(source)){
    return [].concat(source,target)
  }else if( typeof target === 'object'){
    return {...source, ...target}
  }else{
    return source
  }
})

export function error(actionType){ return `${actionType.error}` }
export function success(actionType){ return `${actionType.success}` }

export default function connect( serverActions, options = { url : "/api"}) {
  const {url} = options
  return createStore => (reducer, preloadedState, enhancer) => {
    const resetableReducer = function( state, action ){
      return action.type === RESET_ACTION?
        merge(state, action.payload.state):
        reducer(state, action)
    }

    const store = createStore(resetableReducer, preloadedState, enhancer)

    const dispatch  = action => {
      store.dispatch(action)

      if( serverActions.indexOf(action.type) !== -1 ){
        request
          .post(url)
          .send({
            action,
            state: store.getState()
          })
          .end(function(err, {body}){
            if( err !== null ){
              dispatch( {type: error(action.type)})
            }else{
              dispatch( {...body.action, type:RESET_ACTION})
              dispatch( {...body.action, type: success(action.type)})
            }
          });
      }
    }

    return {
      ...store,
      dispatch
    }
  }
}
