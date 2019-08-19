import { GET_CATE, GET_PRODUCT_BY_CATE, GET_NEXT_PRODUCT_BY_CATE } from '@constants/cate'
import { API_GET_CATE, API_HOME_PRODUCT } from '@constants/api'
import { createAction } from '@utils/redux'

/**
 * 获取分类数据
 * @param {*} payload
 */
export const dispatchCategory = payload => createAction({
  url: API_GET_CATE,
  type: GET_CATE,
  payload
})

/**
 * 首次加载产品数据
 */
export const dispatchCateProduct = payload => createAction({
  method: payload.method,
  url: API_HOME_PRODUCT,
  type: GET_PRODUCT_BY_CATE,
  payload
})

/**
 * 产品加载下一页
 */
export const dispatchCateAppendProduct = payload => createAction({
  url: API_HOME_PRODUCT,
  type: GET_NEXT_PRODUCT_BY_CATE,
  payload
})