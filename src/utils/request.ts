import Taro from '@tarojs/taro'
import { API_USER_LOGIN, API_USER_REGISTE } from '../constants/api'


function getStorage(key) {
  return Taro.getStorage({ key }).then(res => res.data).catch(() => '')
}

function updateStorage(data = {}) {
  return Promise.all([
    Taro.setStorage({ key: 'token', data: data['token'] || '' }),
    Taro.setStorage({ key: 'user', data: data['user'] || ''})
  ])
}

/**
 * 简易封装网络请求
 * // NOTE 需要注意 RN 不支持 *StorageSync，此处用 async/await 解决
 * @param {*} options
 */
export default async function fetch(options) {
  const { url, payload, method = 'GET', showToast = true, autoLogin = true } = options
  const token = await getStorage('token')
  const header = token ? { 'Authorization': token } : {}
  if (method === 'POST') {
    header['content-type'] = 'application/json'
  }

  return Taro.request({
    url,
    method,
    data: payload,
    header
  }).then(async (res) => {
    if (res.statusCode === 200) {
      if (res.data && res.data.code === 0) {
        // 登录成功之后信息缓存
        if (url === API_USER_LOGIN || url === API_USER_REGISTE) {
          await updateStorage(res.data)
        }
      } else if (res.data && res.data.code === 401) {
        // 清除已经登录的书籍
        await updateStorage({})
        // 跳转至登录页
        if (window.location.hash !== '#/pages/user-login/user-login') {
          autoLogin && Taro.navigateTo({
            url: '/pages/user-login/user-login'
          })
        }
      } else {
        // 错误轻提示
        showToast && Taro.showToast({
          title: res.data.msg || '请求异常',
          icon: 'none'
        })
      }
      return res.data
    } else {
      // 用户登录已经过期
      if (res.statusCode === 401) {
        // 清除已经登录的书籍
        await updateStorage({})
        // 跳转至登录页
        autoLogin && Taro.navigateTo({
          url: '/pages/user-login/user-login'
        })
        return { code: 403, msg: '登录状态已过期' }
      }

      // 无权限
      if (res.statusCode === 403) {
        showToast && Taro.showToast({
          title: '您暂无权限进行此操作',
          icon: 'none'
        })
        return { code: 403, msg: '无权限' }
      }

      // 请求不存在
      if (res.statusCode === 404) {
        showToast && Taro.showToast({
          title: '您访问的请求不存在',
          icon: 'none'
        })
        return { code: 403, msg: '请求不存在' }
      }

      // 其他错误
      return Promise.reject(res.data)
    }
  }).catch(err => {
    console.error(err.statusCode)
    return Promise.reject({ code: 500, msg: err && err.errorMsg })
  })
}
