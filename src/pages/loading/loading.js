import { Block, View, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './loading.scss'
// pages/user/user.js
const config = require('../../config.js')
const utils = require('../../utils/util.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    loading: true,
    success: false,
    buttonType: '',
    loginAgain: false,
    params: {},
    text: '欢迎回来'
  }

  componentWillMount(options = this.$router.params || {}) {
    // 检测是否需要尝试自动登录
    if (options.need_login_again) {
      this.setData({ buttonType: 'reLogin', loginAgain: true, loading: false })
      return
    } else {
      this.setData({ params: options })
      this.doLogin()
    }
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  wxLogin = () => {
    return new Promise((resolve, reject) => {
      // 微信登录
      Taro.login({
        success: res => {
          if (res.code) {
            resolve(res.code)
          } else {
            this.setData({ buttonType: 'reLogin' })
            reject(false)
          }
        },
        fail: err => {
          this.setData({ buttonType: 'reLogin' })
          reject(false)
        }
      })
    })
  }
  wxUserInfo = () => {
    return new Promise((resolve, reject) => {
      Taro.getUserInfo({
        success: res => {
          if (res.userInfo) {
            resolve(res.userInfo)
          } else {
            this.setData({ buttonType: 'getUserInfo' })
            reject(false)
          }
        },
        fail: err => {
          this.setData({ buttonType: 'getUserInfo' })
          reject(false)
        }
      })
    })
  }
  doLogin = () => {
    this.setData({ loading: true, text: '', success: false, buttonType: '' })
    this.requestLogin()
      .then(res => {
        this.setData({ loading: false, success: true, buttonType: '' })
        // 正常跳转到首页
        if (!this.data.loginAgain) {
          const reg = /^[A-Za-z0-9-_]+\|\d+$/
          const reg2 = /^[A-Za-z0-9-_]+$/
          if (
            this.data.params &&
            this.data.params.code &&
            reg.test(this.data.params.code)
          ) {
            // 不在跳转分享活动页面，直接在首页领奖
            this.updateShareLog(this.data.params.code)
          } else if (
            this.data.params &&
            this.data.params.fhcode &&
            reg2.test(this.data.params.fhcode)
          ) {
            Taro.redirectTo({
              url: '../invite/invite?fhcode=' + this.data.params.fhcode
            })
          } else if (this.data.params && this.data.params.bookid) {
            // 跳转书籍详情页
            Taro.redirectTo({
              url:
                '../bookdetail/bookdetail?id=' +
                this.data.params.bookid +
                '&indexbtn=1' +
                (this.data.params.auto_secret
                  ? '&auto_secret=' + this.data.params.auto_secret
                  : '')
            })
          } else if (this.data.params && this.data.params.goto) {
            // 跳转其他页面
            if (this.data.params.goto === 'share') {
              Taro.redirectTo({ url: '../activities/share/share' })
            } else {
              Taro.switchTab({ url: '../index/index' })
            }
          } else {
            Taro.switchTab({ url: '../index/index' })
          }
        } else {
          // 重新登录后返回上一页
          Taro.reLaunch({ url: '../index/index' })
          // wx.navigateBack({ delta: 1 })
        }
      })
      .catch(err => {
        Taro.showToast({
          title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录',
          icon: 'none',
          duration: 2000
        })
        this.setData({ loading: false, text: '', success: false })
      })
  }
  requestLogin = () => {
    return new Promise((resolve, reject) => {
      // 判断本地是否有缓存的登录数据，重新登录情况下不管是否存在缓存都重新发送登录接口
      let cacheLoginData = Taro.getStorageSync('cacheLoginData')
      if (
        cacheLoginData &&
        cacheLoginData.expised >= Date.now() &&
        !this.data.loginAgain
      ) {
        app.globalData.token = cacheLoginData.token // 登录token
        app.globalData.userInfo = cacheLoginData.userinfo // 用户信息
        this.getAppSetting()
        this.setData({ text: '欢迎回来！' + cacheLoginData.userinfo.username })
        resolve(true)
      } else {
        this.wxLogin()
          .then(code => {
            // 发送登录凭证到后台换取 openId, sessionKey, unionId
            Taro.request({
              method: 'POST',
              url: config.base_url + '/api/user/login',
              data: {
                identity: 1,
                code: code
              },
              success: res => {
                if (res.data.ok) {
                  // 将token存入缓存，在每次发送需要认证的请求时在header里带上token
                  app.globalData.token = res.data.token // 登录token
                  app.globalData.userInfo = res.data.userinfo // 用户信息
                  Taro.setStorage({
                    key: 'cacheLoginData',
                    data: {
                      token: res.data.token,
                      userinfo: res.data.userinfo,
                      expised: Date.now() + 24 * 60 * 60 * 1000
                    }
                  })
                  // 获取app全局配置
                  this.getAppSetting()
                  this.setData({
                    text: '欢迎回来！' + res.data.userinfo.username
                  })
                  resolve(true)
                } else if (!res.data.ok && res.data.registe === false) {
                  // 未注册，自动注册
                  Taro.clearStorage()
                  this.doRegiste()
                    .then(() => {
                      resolve(true)
                    })
                    .catch(() => {
                      reject(false)
                    })
                } else {
                  Taro.showToast({
                    title:
                      '登录失败' + (res.data.msg ? '，' + res.data.msg : ''),
                    icon: 'none',
                    duration: 2000
                  })
                  this.setData({ buttonType: 'reLogin' })
                  reject(false)
                }
              },
              fail: err => {
                Taro.showToast({
                  title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录',
                  icon: 'none',
                  duration: 2000
                })
                this.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            })
          })
          .catch(err => {
            reject(false)
          })
      }
    })
  }
  doRegiste = () => {
    return new Promise((resolve, reject) => {
      this.wxLogin()
        .then(code => {
          this.wxUserInfo().then(userInfo => {
            // 发送注册接口
            Taro.request({
              method: 'POST',
              url: config.base_url + '/api/user/registe',
              data: Object.assign({ identity: 'appuser', code }, userInfo),
              success: res => {
                if (res.data.ok) {
                  app.globalData.token = res.data.token // 登录token
                  app.globalData.userInfo = res.data.userinfo // 用户详情
                  Taro.setStorage({
                    key: 'cacheLoginData',
                    data: {
                      token: res.data.token,
                      userinfo: res.data.userinfo,
                      expised: Date.now() + 24 * 60 * 60 * 1000
                    }
                  })
                  this.getAppSetting()
                  this.setData({ text: '遇见你，真高兴~' })
                  resolve(true)
                } else {
                  Taro.showToast({
                    title:
                      '注册失败' + (res.data.msg ? '，' + res.data.msg : ''),
                    icon: 'none',
                    duration: 2000
                  })
                  this.setData({ buttonType: 'reLogin' })
                  reject(false)
                }
              },
              fail: err => {
                Taro.showToast({
                  title: '当前阅读人数可能过多\n请点击下方登录按钮尝试重新登录',
                  icon: 'none',
                  duration: 2000
                })
                this.setData({ buttonType: 'reLogin' })
                reject(false)
              }
            })
          })
        })
        .catch(err => {
          reject(false)
        })
    })
  }
  updateShareLog = share_id => {
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          Taro.showToast({ title: '获得15书币的奖励', icon: 'success' })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          if (!res.data.inviteself) {
            Taro.showToast({
              title: '接收邀请失败' + (res.data.msg ? '，' + res.data.msg : ''),
              icon: 'none',
              duration: 2000
            })
          }
        }
        // 领完分享奖励跳转首页
        setTimeout(() => {
          Taro.switchTab({ url: '../index/index' })
        }, 1000)
      },
      fail: err => {
        Taro.showToast({ title: '接收邀请失败', icon: 'none', duration: 2000 })
        setTimeout(function() {
          Taro.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  }
  getAppSetting = () => {
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/user/setting',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          for (let i in res.data.data.setting) {
            if (utils.isJsonString(res.data.data.setting[i])) {
              res.data.data.setting[i] = JSON.parse(res.data.data.setting[i])
            }
          }
          app.globalData.globalSetting = res.data.data.setting // 系统全局设置
          app.globalData.shareCode = res.data.data.share.code // 用户分享码
          app.globalData.shareWhiteList = res.data.data.share_white_list // 是否是分享白名单用户
          // 获取最新通知数量
          const hasReadMessages = Taro.getStorageSync('hasReadMessages') || []
          app.globalData.unReadMessages =
            res.data.notices instanceof Array
              ? res.data.notices.filter(
                  item => hasReadMessages.indexOf(item) < 0
                )
              : []
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title:
              '获取应用设置失败' + (res.data.msg ? '，' + res.data.msg : ''),
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '获取应用设置失败',
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => {
          Taro.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  }
  afterGetUserInfo = () => {
    this.doLogin()
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '美景阅读',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { loading, text, success, buttonType } = this.state
    return (
      <View className="load-page">
        <Image
          className="app-logo"
          src="https://fs.andylistudio.com/mbook/v3/images/logo.png"
        ></Image>
        <View className="app-name">美景阅读</View>
        <View className="status">
          {loading && (
            <View className="status-item">
              <Image
                className="loading"
                src={require('../../static/img/book-loading.svg')}
              ></Image>
              登录中...
            </View>
          )}
          {success && <View className="status-item">{text}</View>}
          {buttonType === 'reLogin' && (
            <View className="status-item">
              <Button onClick={this.doLogin}>立即登录</Button>
            </View>
          )}
          {buttonType === 'getUserInfo' && (
            <View className="status-item">
              <Button
                openType="getUserInfo"
                lang="zh_CN"
                onGetuserinfo={this.afterGetUserInfo}
              >
                授权小程序
              </Button>
            </View>
          )}
        </View>
      </View>
    )
  }
}

export default _C
