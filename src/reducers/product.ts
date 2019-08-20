import { GET_PRODUCT_DETAIL } from '../constants/product'

const INITIAL_STATE = {
  detail: {}
}

export default function product(state = INITIAL_STATE, action) {
  switch (action.type) {
    case GET_PRODUCT_DETAIL: {
      const noDetail = { ...action.payload.data }
      delete noDetail.detail
      return { ...state, detail: { ...noDetail, ...action.payload.data.detail } }
    }
    default:
      return state
  }
}
