import { HOME_BANNER, HOME_PRODUCT, GET_NEXT_PRODUCT_BY_HOME } from '../constants/home'
import { API_HOME_BANNER, API_HOME_PRODUCT } from '../constants/api'
import { createAction } from '../utils/redux'

/**
 * 首页数据-广告
 * @param {*} payload
 */
export const getBanner = payload => createAction({
  url: API_HOME_BANNER,
  type: HOME_BANNER,
  payload
})

/**
 * 首页数据-产品列表
 * @param {*} payload
 */
 export const getProduct = payload => createAction({
  url: API_HOME_PRODUCT,
  type: HOME_PRODUCT,
  payload
})

/**
 * 产品加载下一页
 */
export const getAppendProduct = payload => createAction({
  url: API_HOME_PRODUCT,
  type: GET_NEXT_PRODUCT_BY_HOME,
  payload
})
