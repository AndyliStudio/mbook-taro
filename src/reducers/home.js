import { HOME_BANNER, HOME_PRODUCT, GET_NEXT_PRODUCT_BY_HOME } from '@constants/home'

const INITIAL_STATE = {
  banner: [],
  notice: ['同时申请多个产品，可提高贷款通过率'],
  products: [],
  hasMore: true
}

export default function home(state = INITIAL_STATE, action) {
  switch (action.type) {
    case HOME_BANNER: {
      return {
        ...state,
        banner: action.payload.list
      }
    }
    case HOME_PRODUCT: {
      return {
        ...state,
        products: action.payload.list,
        hasMore: !!action.payload.more
      }
    }
    case GET_NEXT_PRODUCT_BY_HOME: {
      const products = state.products.concat(action.payload.list)
      return { ...state, products, hasMore: !!action.payload.more }
    }
    default:
      return state
  }
}
