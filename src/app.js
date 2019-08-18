import { Block } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './app.scss'
//app.js
const config = require('./config.js')
const utils = require('./utils/util.js')

class App extends Taro.Component {
  componentWillMount() {
    this.$app.globalData = this.globalData

    if (typeof Taro.getUpdateManager === 'function') {
      // 处理版本更新的动作
      const updateManager = Taro.getUpdateManager()
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate ? '有新版本' : '暂无新版本')
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function() {
            // wx.showModal({
            //   title: '更新提示',
            //   content: '新版本已经准备好，是否重启应用？',
            //   success: function(res) {
            //     if (res.confirm) {
            //       // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            //       updateManager.applyUpdate()
            //     }
            //   }
            // })
            updateManager.applyUpdate()
          })
        }
      })
      updateManager.onUpdateFailed(function() {
        // 新的版本下载失败
        Taro.showModal({
          title: '更新提示',
          content: '新版本下载失败，请检查您的网络',
          showCancel: false
        })
      })
    } else {
      Taro.showModal({
        title: '更新提示',
        content:
          '你的微信当前版本太低，无法完成书城更新，请重启微信来获取最新版本',
        showCancel: false
      })
    }
  }

  reportFormId = (type, formId, bookId) => {
    let self = this
    Taro.request({
      method: 'GET',
      url:
        config.base_url +
        '/api/upload_formid?type=' +
        type +
        '&formId=' +
        formId +
        '&bookId=' +
        (bookId || ''),
      header: { Authorization: 'Bearer ' + self.globalData.token },
      success: function(res) {
        if (!res.data.ok) {
          return
        }
      },
      fail: function(err) {
        return
      }
    })
  }
  navigateTo = page => {
    let self = this
    setTimeout(function() {
      Taro.navigateTo({
        url: page,
        fail: err => {
          self.navigateTo(page)
        }
      })
    }, 300)
  }

  componentDidCatchError(error) {
    return
  }

  globalData = {
    token: '',
    userInfo: {}, // 用户基本信息
    shareCode: '', // 邀请码
    globalSetting: {},
    showReaderTips: false
  }
  config = {
    pages: [
      'pages/loading/loading',
      'pages/index/index',
      'pages/bookdetail/bookdetail',
      'pages/reader-new/reader-new',
      'pages/reader-mulu/reader-mulu',
      'pages/invite/invite',
      'pages/activities/share/share',
      'pages/activities/friendHelp/friendHelp',
      'pages/search2/search2',
      'pages/shutcheck/shutcheck',
      'pages/user/user',
      'pages/booklist/booklist',
      'pages/shop/shop',
      'pages/classify/classify',
      'pages/setting/setting',
      'pages/attendance/attendance',
      'pages/charge/charge',
      'pages/webpage/webpage',
      'pages/search/search',
      'pages/notice/notice',
      'pages/readtime/readtime',
      'pages/account/account',
      'pages/aboutus/aboutus'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#4990e2',
      navigationBarTitleText: '微书',
      navigationBarTextStyle: 'white'
    },
    tabBar: {
      color: '#676767',
      selectedColor: '#4990e2',
      borderStyle: 'white',
      backgroundColor: '#ffffff',
      list: [
        {
          pagePath: 'pages/index/index',
          iconPath: 'static/img/index.png',
          selectedIconPath: 'static/img/index_active.png',
          text: '首页'
        },
        {
          pagePath: 'pages/booklist/booklist',
          iconPath: 'static/img/book.png',
          selectedIconPath: 'static/img/book_active.png',
          text: '阅读记录'
        },
        {
          pagePath: 'pages/user/user',
          iconPath: 'static/img/user.png',
          selectedIconPath: 'static/img/user_active.png',
          text: '我的'
        }
      ]
    },
    networkTimeout: {
      request: 10000,
      connectSocket: 10000,
      uploadFile: 10000,
      downloadFile: 10000
    },
    debug: true,
    sitemapLocation: 'sitemap.json'
  }

  render() {
    return null
  }
}

export default App
Taro.render(<App />, document.getElementById('app'))
