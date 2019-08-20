import { GET_PRODUCT_DETAIL } from '../constants/product'
import { API_GET_PRODUCT_DETAIL } from '../constants/api'
import { createAction } from '../utils/redux'

/**
 * 获取产品详情
 * @param {*} payload
 */
export const dispatchGetProductDetail = payload => createAction({
  url: API_GET_PRODUCT_DETAIL.replace('{id}', payload.id),
  type: GET_PRODUCT_DETAIL,
  payload
})
