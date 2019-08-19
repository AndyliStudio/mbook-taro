import Taro from '@tarojs/taro'
import { USER_INFO, USER_LOGIN, USER_LOGOUT } from '@constants/user'

const INITIAL_STATE = {
  userInfo: {}
}

export default function user(state = INITIAL_STATE, action) {
  switch(action.type) {
    case USER_INFO: {
      return {
        ...state,
        userInfo: {
          ...action.payload,
          login: true
        }
      }
    }
    case USER_LOGIN: {
      return { ...state, userInfo: action.payload.user }
    }
    case USER_LOGOUT: {
      // 清除本地缓存
      Taro.setStorage({ key: 'token', data: '' }),
      Taro.setStorage({ key: 'user', data: ''})
      console.log('已经清除本地用户信息缓存')
      setTimeout(() => {
        Taro.navigateTo({
          url: '/pages/user-login/user-login'
        })
      }, 1000)
      return {
        ...INITIAL_STATE
      }
    }
    default:
      return state
  }
}
