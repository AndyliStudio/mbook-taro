import { GET_CATE, GET_PRODUCT_BY_CATE, GET_NEXT_PRODUCT_BY_CATE } from '../constants/cate'

const INITIAL_STATE = {
  menu: ['智能排序', '高通过率', '利率低', '秒审核'],
  products: [],
  hasMore: true
}

export default function cate(state = INITIAL_STATE, action) {
  switch (action.type) {
    case GET_CATE:
      {
        const menu = action.payload.list
        return { ...state, menu }
      }
    case GET_PRODUCT_BY_CATE:
      {
        const products = action.payload.list
        return { ...state, products, hasMore: !!action.payload.more }
      }
    case GET_NEXT_PRODUCT_BY_CATE:
      {
        const products = state.products.concat(action.payload.list)
        return { ...state, products, hasMore: !!action.payload.more }
      }
    default:
      return state
  }
}
