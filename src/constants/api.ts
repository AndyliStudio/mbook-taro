/**
 * NOTE HOST、HOST_M 是在 config 中通过 defineConstants 配置的
 * 只所以不在代码中直接引用，是因为 eslint 会报 no-undef 的错误，因此用如下方式处理
 */
/* eslint-disable */
export const host = 'https://mbook.andylistudio.com/api'
/* eslint-enable */

// pic
export const CDN = 'https://fs.andylistudio.com/loan'

// home
export const API_HOME_BANNER = `${host}/front/banner`
export const API_HOME_PRODUCT = `${host}/front/product`

// category
export const API_GET_CATE = `${host}/front/category`

// user
export const API_USER = `${host}/user/current`
export const API_USER_LOGIN = `${host}/user/login`
export const API_USER_SEND_VERIFY = `${host}/user/send_verify`
export const API_USER_REGISTE = `${host}/user/registe`
export const API_USER_RESET_PASS = `${host}/user/reset_password`
export const API_CHECK_LOGIN = `${host}/user/check_login`

// log
export const API_LOG: string = `${host}/stat`

// item
export const API_ITEM = `${host}/xhr/item/detail.json`
export const API_ITEM_RECOMMEND = `${host}/xhr/rcmd/itemDetail.json`

// product
export const API_GET_PRODUCT_DETAIL = `${host}/product/{id}/detail`
