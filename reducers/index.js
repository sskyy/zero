const userState = {
  name: 'anonymous',
  age: 1,
  friends: [{ name: 'Tim', age:2}]
}

export default function user(state = userState, action) {
  switch (action.type) {
    default:
      return state
  }
}
