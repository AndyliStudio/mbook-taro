import {
  Block,
  View,
  Image,
  Icon,
  Text,
  Button,
  Slider,
  Switch
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import NoData from '../../component/nodata/nodata'
import './reader-new.scss'
// pages/user/user.js
const config = require('../../config.js')
const utils = require('../../utils/util.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    loading: true,
    chapterInfo: '',
    content: '',
    showMenu: false,
    menuName: 'default',
    chapterNum: 1,
    maxChapterNum: 1,
    fontSize: 18,
    bright: 50,
    isAutoBuy: true,
    useNightStyle: false,
    showReaderTips: false,
    canRead: true,
    loadFail: false, // 章节加载失败
    shutChargeTips: false // 是否关闭充值引导
  }
  other = {
    bookid: '',
    name: '',
    updateStatus: '',
    hasRssTheBook: 0,
    preload: {
      loaded: false,
      data: ''
    },
    scrollTopTimer: null,
    scrollTopValue: 0,
    readTime: 0,
    preChapterNum: 1,
    backFromMulu: false,
    backFromMuluId: ''
  }

  componentWillMount(options = this.$router.params || {}) {
    if (!options.bookid) {
      Taro.showToast({ title: '页面参数错误', icon: 'none', duration: 2000 })
      Taro.navigateBack({ delta: 1 })
      return false
    }
    this.other.bookid = options.bookid
    // 获取章节
    this.getChapter('', options.chapterid, true, false)
    // 获取缓存的阅读设置
    let readerSetting = Taro.getStorageSync('readerSetting')
    // 获取并设置亮度
    Taro.getScreenBrightness({
      success: res => {
        this.setData({ bright: parseInt(res.value * 100) })
      }
    })
    // if (readerSetting.bright) {
    //   wx.setScreenBrightness({ value: parseInt(readerSetting.bright) / 100 })
    // } else {
    //   wx.getScreenBrightness({
    //     success: res => {
    //       this.setData({ bright: parseInt(res.value * 100) })
    //     }
    //   })
    // }
    // 其他设置
    if (readerSetting) {
      this.setData(readerSetting)
    }
    Taro.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: readerSetting.useNightStyle ? '#343434' : '#1472e0'
    })
    // 是否展示阅读提示
    let readerTips = Taro.getStorageSync('readerTips')
    if (!readerTips) {
      this.setData({
        showReaderTips: !readerTips,
        showMenu: true,
        menuName: 'default',
        shutChargeTips: app.globalData.globalSetting.shut_charge_tips
      })
    } else {
      this.setData({
        showReaderTips: !readerTips,
        shutChargeTips: app.globalData.globalSetting.shut_charge_tips
      })
    }
  }

  componentWillUnmount() {
    // 存储阅读器设置
    Taro.setStorageSync('readerSetting', {
      fontSize: this.data.fontSize,
      bright: this.data.bright,
      isAutoBuy: this.data.isAutoBuy,
      useNightStyle: this.data.useNightStyle,
      isAutoBuy: this.data.isAutoBuy
    })
    this.updateRead()
    clearInterval(this.other.scrollTopTimer)
  }

  componentDidHide() {
    // 存储阅读器设置
    Taro.setStorageSync('readerSetting', {
      fontSize: this.data.fontSize,
      bright: this.data.bright,
      isAutoBuy: this.data.isAutoBuy,
      useNightStyle: this.data.useNightStyle,
      isAutoBuy: this.data.isAutoBuy
    })
    this.updateRead()
    clearInterval(this.other.scrollTopTimer)
  }

  componentDidShow() {
    // 判断是否从目录返回，如果是则加载指定章节
    if (this.other.backFromMulu && this.other.backFromMuluId) {
      this.getChapter('', this.other.backFromMuluId, true, true)
      this.other.backFromMulu = false
      this.other.backFromMuluId = ''
    }
    // 每过2s记录下阅读状态
    this.other.scrollTopTimer = setInterval(() => {
      let query = Taro.createSelectorQuery()
      query.selectViewport().scrollOffset()
      query.exec(res => {
        if (res[0].scrollTop !== this.other.scrollTopValue) {
          this.other.readTime += 1000
        }
        this.other.scrollTopValue = res[0].scrollTop
      })
    }, 1000)
  }

  onReachBottom = () => {
    if (!this.other.preload.loaded) {
      this.preLoadChapter(this.data.chapterNum + 1)
    }
  }
  getChapter = (num, chapterid, skipPreload, scrollTopAuto) => {
    this.other.preChapterNum = this.data.chapterNum
    if (!skipPreload && num && this.other.preload.loaded) {
      let res = this.other.preload.data
      if (res.ok) {
        this.setData({
          chapterInfo: `第${res.data.num}章 ${res.data.name}`,
          content: ' ' + res.data.content.replace(/[\r\n]+\s*/g, '\n\n '),
          chapterNum: res.data.num,
          maxChapterNum: res.newest,
          canRead: res.canRead
        })
        this.other = Object.assign(this.other, {
          name: res.bookname,
          updateStatus: res.update_status,
          hasRssTheBook: res.rss,
          preload: {
            loaded: false,
            data: ''
          }
        })
        // 设置标题
        Taro.setNavigationBarTitle({ title: res.data.name })
        // 滑动到指定位置
        setTimeout(() => {
          if (scrollTopAuto) {
            Taro.pageScrollTo({ scrollTop: 0, duration: 0 })
          } else {
            Taro.pageScrollTo({ scrollTop: parseInt(res.scroll), duration: 0 })
          }
        }, 100)
      } else {
        this.showLoadFailPage()
      }
      return false
    }
    this.setData({ loading: true })
    let queryStr = num ? '&chapter_num=' + num : ''
    queryStr += chapterid ? '&chapter_id=' + chapterid : ''
    Taro.request({
      url:
        config.base_url +
        '/api/chapter/detail?bookid=' +
        this.other.bookid +
        queryStr,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.setData({
            chapterInfo: `第${res.data.data.num}章 ${res.data.data.name}`,
            content:
              ' ' + res.data.data.content.replace(/[\r\n]+\s*/g, '\n\n '),
            loading: false,
            chapterNum: res.data.data.num,
            maxChapterNum: res.data.newest,
            canRead: res.data.canRead
          })
          this.other = Object.assign(this.other, {
            name: res.data.bookname,
            updateStatus: res.data.update_status,
            hasRssTheBook: res.data.rss,
            preload: {
              loaded: false,
              data: ''
            },
            scrollTopValue: parseInt(res.data.scroll)
          })
          // 设置标题
          Taro.setNavigationBarTitle({ title: res.data.data.name })
          // 滑动到指定位置
          setTimeout(() => {
            if (scrollTopAuto) {
              Taro.pageScrollTo({ scrollTop: 0, duration: 0 })
            } else {
              Taro.pageScrollTo({
                scrollTop: parseInt(res.data.scroll),
                duration: 0
              })
            }
          }, 100)
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (
            utils
              .getCurrentPageUrlWithArgs()
              .indexOf('/loading/loading?need_login_again=1') < 0
          ) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            this.showLoadFailPage()
          }
        } else {
          // 展示获取章节失败的界面
          this.showLoadFailPage()
        }
      },
      fail: err => {
        this.showLoadFailPage()
      }
    })
  }
  preLoadChapter = num => {
    Taro.request({
      url:
        config.base_url +
        '/api/chapter/detail?bookid=' +
        this.other.bookid +
        '&chapter_num=' +
        num,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.other.preload.data = res.data
          this.other.preload.loaded = true
        }
      }
    })
  }
  showLoadFailPage = () => {
    this.setData({
      loading: false,
      loadFail: true,
      chapterNum: this.other.preChapterNum + 1
    })
  }
  gotoMulu = () => {
    Taro.navigateTo({
      url:
        '../reader-mulu/reader-mulu?bookid=' +
        this.other.bookid +
        '&name=' +
        this.other.name
    })
  }
  loadChapter = event => {
    if (event.currentTarget.dataset.op === 'pre') {
      // 点击上一章
      if (this.data.chapterNum - 1 <= 0) {
        Taro.showToast({
          title: '当前已经是第一章了',
          icon: 'none',
          duration: 2000
        })
        return false
      }
      this.other.preload = {
        loaded: false,
        data: ''
      }
      this.getChapter(this.data.chapterNum - 1, '', true, true)
    } else if (event.currentTarget.dataset.op === 'next') {
      // 点击下一章
      if (this.data.chapterNum + 1 > this.data.maxChapterNum) {
        // 判断是否是连载书籍，如果是则提示订阅书籍
        if (this.other.updateStatus === '连载中') {
          if (!this.other.hasRssTheBook) {
            Taro.showModal({
              title: '温馨提示',
              content:
                '你已经阅读到了最后一章，如果喜欢这本书，可以点击下方按钮订阅本书。书籍章节更新时我们会在第一时间通知你.~',
              confirmText: '订阅本书',
              confirmColor: '#1AAD19',
              success: res => {
                if (res.confirm) {
                  Taro.request({
                    method: 'POST',
                    url: config.base_url + '/api/booklist/rss',
                    header: { Authorization: 'Bearer ' + app.globalData.token },
                    data: {
                      bookid: this.other.bookid,
                      rss: 1
                    },
                    success: res => {
                      if (res.data.ok) {
                        Taro.showToast({
                          icon: 'success',
                          title: '订阅成功'
                        })
                        this.other.hasRssTheBook = 1
                        let hasRssBookArr =
                          Taro.getStorageSync('hasRssBookArr') || []
                        if (hasRssBookArr.indexOf(this.other.bookid) < 0) {
                          hasRssBookArr.push(this.other.bookid)
                          Taro.setStorageSync('hasRssBookArr', hasRssBookArr)
                        }
                      } else if (res.data.authfail) {
                        Taro.navigateTo({
                          url: '../loading/loading?need_login_again=1'
                        })
                      } else {
                        Taro.showToast({
                          title: res.data.msg || '订阅书籍失败，请重试'
                        })
                      }
                    },
                    fail: err => {
                      Taro.showToast({ title: '订阅书籍失败，请重试' })
                    }
                  })
                }
              }
            })
          } else {
            Taro.showToast({
              title: '当前已经是最后一章了',
              icon: 'none',
              duration: 2000
            })
          }
        } else {
          Taro.showModal({
            title: '温馨提示',
            content: '您已经读完全书，去首页发现更多好书吧~',
            confirmText: '前往首页',
            confirmColor: '#1AAD19',
            success(res) {
              if (res.confirm) {
                Taro.switchTab({
                  url: '/pages/index/index'
                })
              }
            }
          })
        }
        return false
      }
      this.getChapter(this.data.chapterNum + 1)
    } else {
      Taro.showToast({ title: '错误操作', icon: 'none', duration: 2000 })
    }
    // 如果菜单为显示状态则关闭菜单
    if (this.data.showMenu) {
      this.setData({ showMenu: false, menuName: 'default' })
    }
    // 页面滚动到顶部
    Taro.pageScrollTo({ scrollTop: 0, duration: 0 })
  }
  changeChapterSlide = event => {
    this.getChapter(event.detail.value, '', true, true)
  }
  changeFontSize = event => {
    if (event.currentTarget.dataset.op === 'reduce') {
      this.setData({ fontSize: this.data.fontSize - 1 })
    } else if (event.currentTarget.dataset.op === 'add') {
      this.setData({ fontSize: this.data.fontSize + 1 })
    }
  }
  changeBright = event => {
    let bright = event.detail.value / 100
    Taro.setScreenBrightness({ value: bright })
    this.setData({ bright: event.detail.value })
  }
  changeAutoBuy = event => {
    this.setData({ isAutoBuy: event.detail.value })
    Taro.request({
      url: config.base_url + '/api/user/put_user_setting',
      method: 'PUT',
      data: {
        setting: { autoBuy: event.detail.value }
      },
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          return true
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: '更新设置失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({ title: '更新设置失败', icon: 'none', duration: 2000 })
      }
    })
  }
  triggleMenu = () => {
    if (this.data.showMenu) {
      this.setData({ showMenu: false, menuName: 'default' })
    } else {
      this.setData({ showMenu: true, menuName: 'default' })
    }
  }
  switchMenu = event => {
    let name = event.currentTarget.dataset.name
    if (name === 'night') {
      // 修改状态栏颜色
      Taro.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: this.data.useNightStyle ? '#1472e0' : '#343434'
      })
      this.setData({ useNightStyle: !this.data.useNightStyle })
    } else if (name === 'menu') {
      this.gotoMulu()
    } else {
      this.setData({ menuName: name })
    }
  }
  closeReaderTips = () => {
    this.setData({
      showReaderTips: false,
      showMenu: false,
      menuName: 'default'
    })
    Taro.setStorageSync('readerTips', true)
  }
  gotoFriendHelp = () => {
    Taro.navigateTo({ url: '../activities/friendHelp/friendHelp' })
  }
  buyChapter = () => {
    Taro.request({
      url:
        config.base_url +
        '/api/chapter/buy?bookid=' +
        this.other.bookid +
        '&chapter_num=' +
        this.data.chapterNum,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          this.setData({ canRead: true })
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (
            utils
              .getCurrentPageUrlWithArgs()
              .indexOf('/loading/loading?need_login_again=1') < 0
          ) {
            Taro.navigateTo({ url: '../loading/loading?need_login_again=1' })
          }
        } else if (res.data.nomoney) {
          // 费用不足
          Taro.showModal({
            title: '温馨提示',
            content: '书币不足，您可以通过分享、签到等方式获得书币。',
            confirmText: '前往签到',
            success(res) {
              if (res.confirm) {
                Taro.navigateTo({ url: '../attendance/attendance' })
              }
            }
          })
        } else {
          Taro.showToast({
            title: '购买失败' + (res.data.msg ? '，' + res.data.msg : ''),
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({ title: '购买失败', icon: 'none', duration: 2000 })
      }
    })
  }
  buyTotal = () => {
    Taro.showModal({
      title: '温馨提示',
      content: '请前往书籍详情页成为粉丝',
      confirmText: '立即前往',
      success: res => {
        if (res.confirm) {
          Taro.navigateTo({
            url: '../bookdetail/bookdetail?id=' + this.other.bookid
          })
        }
      }
    })
  }
  buyCancel = () => {
    this.getChapter(
      this.other.preChapterNum - 1 > 0 ? this.other.preChapterNum - 1 : 1,
      '',
      true,
      true
    )
  }
  gotoDetail = () => {
    let pages = Taro.getCurrentPages()
    let lastPage = pages.length > 2 ? pages[pages.length - 2].route : ''
    // 判断上一页是否是书籍详情页面，如果是则返回，否则则打开书籍详情页
    if (lastPage.indexOf('pages/bookdetail/bookdetail') > -1) {
      Taro.navigateBack({ delta: 1 })
    } else {
      Taro.navigateTo({
        url: '../bookdetail/bookdetail?id=' + this.other.bookid
      })
    }
  }
  updateRead = () => {
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/update_read',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        bookid: this.other.bookid,
        chapter_num: this.data.chapterNum,
        chapter_page_index: 0,
        chapter_page_top: this.other.scrollTopValue,
        read_time: this.other.readTime
      },
      success: res => {
        if (res.data.ok) {
          return true
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (
            utils
              .getCurrentPageUrlWithArgs()
              .indexOf('/loading/loading?need_login_again=1') < 0
          ) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          }
        } else {
          Taro.showToast({
            title: '更新阅读进度失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '更新阅读进度失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  reloadCurChapter = () => {
    this.getChapter(this.data.chapterNum, '', true, true)
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '请稍后...',
    navigationBarTextStyle: 'white',
    onReachBottomDistance: 800,
    enablePullDownRefresh: false
  }

  render() {
    const {
      useNightStyle,
      canRead,
      loading,
      showReaderTips,
      chapterInfo,
      fontSize,
      content,
      loadFail,
      showMenu,
      menuName,
      maxChapterNum,
      chapterNum,
      bright,
      isAutoBuy,
      shutChargeTips
    } = this.state
    return (
      <View
        className={
          'reader ' +
          (useNightStyle ? 'night' : '') +
          ' ' +
          (!canRead ? 'overflow' : '')
        }
      >
        {loading && (
          <View className="loading">
            <Image src="https://fs.andylistudio.com/mbook/book-loading.svg"></Image>
          </View>
        )}
        {showReaderTips && (
          <View className="reader-tips" onClick={this.closeReaderTips}>
            <View className="tips1">
              <Icon className="iconfont icon-dianji"></Icon>
              <Text>点击屏幕可以打开菜单</Text>
            </View>
            <View className="tips2">
              <View className="circle"></View>
              <Text>点击目录可以自由选择阅读章节</Text>
            </View>
            <View className="tips3">
              <View className="circle"></View>
              <Text>点击设置可以修改亮度和字体大小</Text>
            </View>
            <View className="tips4">
              <View className="circle"></View>
              <Text>点击夜间可以切换为夜间模式</Text>
            </View>
          </View>
        )}
        {!loadFail ? (
          <Block>
            <View className="container" onClick={this.triggleMenu}>
              <View className="header-info">{chapterInfo}</View>
              <Text
                selectable={true}
                space="emsp"
                className="content"
                style={'font-size: ' + fontSize * 2 + 'rpx'}
              >
                {content}
              </Text>
            </View>
          </Block>
        ) : (
          <Block>
            <View className="load-fail">
              <Icon className="iconfont icon-zanwushuju"></Icon>
              <View className="load-fail-text">加载章节失败</View>
              <View className="load-fail-sub-text">
                服务器繁忙，请点击下方按钮重新尝试
              </View>
              <Button
                className="load-fail-btn"
                type="default"
                size="mini"
                onClick={this.reloadCurChapter}
              >
                重新加载
              </Button>
            </View>
          </Block>
        )}
        <View className="bottom-btn">
          <Button className="shadow" onClick={this.loadChapter} data-op="pre">
            上一章
          </Button>
          <Button className="shadow" onClick={this.gotoMulu}>
            目录
          </Button>
          <Button className="shadow" onClick={this.loadChapter} data-op="next">
            下一章
          </Button>
        </View>
        <View
          className={
            'left-btns ' +
            (showMenu ? 'animated slideInRight' : 'animated slideOutRight')
          }
        >
          <Button onClick={this.gotoDetail}>前往详情页</Button>
        </View>
        <View
          className={
            'menu ' +
            (showMenu ? 'animated slideInUp' : 'animated slideOutDown') +
            ' ' +
            menuName
          }
        >
          <View className="menu-content">
            {menuName === 'default' && (
              <Block>
                <View className="info">{chapterInfo}</View>
                <View className="form">
                  <Button onClick={this.loadChapter} data-op="pre">
                    上一章
                  </Button>
                  <Slider
                    blockSize="16"
                    activeColor={useNightStyle ? '#808080' : '#343434'}
                    backgroundColor={useNightStyle ? '#4e4e4e' : '#e9e9e9'}
                    blockColor={useNightStyle ? '#808080' : '#343434'}
                    onChange={this.changeChapterSlide}
                    step="1"
                    min="1"
                    max={maxChapterNum}
                    value={chapterNum}
                  ></Slider>
                  <Button onClick={this.loadChapter} data-op="next">
                    下一章
                  </Button>
                </View>
              </Block>
            )}
            {menuName === 'setting' && (
              <Block>
                <View className="bright">
                  <Icon className="iconfont icon-dark"></Icon>
                  <Slider
                    blockSize="16"
                    activeColor={useNightStyle ? '#808080' : '#343434'}
                    backgroundColor={useNightStyle ? '#4e4e4e' : '#e9e9e9'}
                    blockColor={useNightStyle ? '#808080' : '#343434'}
                    onChange={this.changeBright}
                    step="1"
                    min="1"
                    max="100"
                    value={bright}
                  ></Slider>
                  <Icon className="iconfont icon-light"></Icon>
                </View>
                <View className="font-size">
                  <Text>字号</Text>
                  <View className="right">
                    <Icon
                      className="iconfont icon-font-size-reduce"
                      onClick={this.changeFontSize}
                      data-op="reduce"
                    ></Icon>
                    <Text className="cur-font-size">{fontSize}</Text>
                    <Icon
                      className="iconfont icon-font-size-add"
                      onClick={this.changeFontSize}
                      data-op="add"
                    ></Icon>
                  </View>
                </View>
                <View className="auto-buy">
                  <Text>自动购买下一章</Text>
                  <View className="right">
                    <Switch
                      color="#1472e0"
                      checked={isAutoBuy}
                      onChange={this.changeAutoBuy}
                    ></Switch>
                  </View>
                </View>
              </Block>
            )}
          </View>
          <View className="menu-footer">
            <View
              className="menu-item"
              onClick={this.switchMenu}
              data-name="menu"
            >
              <Icon className="iconfont icon-menu"></Icon>
              <Text>目录</Text>
            </View>
            <View
              className="menu-item"
              onClick={this.switchMenu}
              data-name="setting"
            >
              <Icon className="iconfont icon-setting"></Icon>
              <Text>设置</Text>
            </View>
            <View
              className="menu-item"
              onClick={this.switchMenu}
              data-name="night"
            >
              <Icon className="iconfont icon-night"></Icon>
              <Text>夜间</Text>
            </View>
          </View>
        </View>
        {!canRead && (
          <View className="buy">
            <View className="buy-inner">
              <Button onClick={this.buyChapter}>使用书币阅读本章</Button>
              {!shutChargeTips && (
                <Button onClick={this.buyTotal}>我是粉丝，免费阅读</Button>
              )}
              {!shutChargeTips && (
                <Button onClick={this.gotoFriendHelp}>邀请好友‧免费</Button>
              )}
              <Button className="cancel-btn" onClick={this.buyCancel}>
                取消
              </Button>
            </View>
          </View>
        )}
      </View>
    )
  }
}

export default _C
