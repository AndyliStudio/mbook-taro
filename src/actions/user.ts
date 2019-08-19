import { USER_INFO, USER_LOGIN, USER_SEND_VERIFY, USER_REGISTE, USER_RESET_PASS, USER_LOGOUT } from '@constants/user'
import { API_USER, API_USER_LOGIN, API_USER_SEND_VERIFY, API_USER_REGISTE, API_USER_RESET_PASS } from '@constants/api'
import { createAction } from '@utils/redux'

/**
 * 获取用户信息
 * @param {*} payload
 */
export const dispatchUser = payload => createAction({
  url: API_USER,
  fetchOptions: {
    showToast: false,
    autoLogin: true
  },
  type: USER_INFO,
  payload
})

/**
 * 用户登录
 * @param {*} payload
 */
export const dispatchLogin = payload => createAction({
  method: 'POST',
  url: API_USER_LOGIN,
  type: USER_LOGIN,
  fetchOptions: {
    showToast: false,
    autoLogin: false
  },
  payload
})

/**
 * 发送验证码
 * @param {*} payload
 */
export const dispatchVerify = payload => createAction({
  method: 'POST',
  url: API_USER_SEND_VERIFY,
  type: USER_SEND_VERIFY,
  payload
})

/**
 * 注册
 * @param {*} payload
 */
 export const dispatchRegiste = payload => createAction({
  method: 'POST',
  url: API_USER_REGISTE,
  type: USER_REGISTE,
  payload
})

/**
 * 找回密码
 * @param {*} payload
 */
 export const dispatchRestPass = payload => createAction({
  method: 'POST',
  url: API_USER_RESET_PASS,
  type: USER_RESET_PASS,
  payload
})

/**
 * 用户退出登录
 */
export const dispatchLogout = () => ({ type: USER_LOGOUT })
