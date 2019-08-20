
import { combineReducers } from 'redux'
import cate from './cate'
import home from './home'
import item from './item'
import user from './user'
import product from './product'

export default combineReducers({
  home,
  cate,
  item,
  user,
  product
})
