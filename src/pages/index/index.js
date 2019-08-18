import {
  Block,
  View,
  Image,
  Icon,
  Swiper,
  SwiperItem,
  Navigator,
  Text
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import LazyloadImg from '../../component/lazyload-img/lazyload-img'
import NoData from '../../component/nodata/nodata'
import Redpock from '../../component/redpock/redpock'
import './index.scss'
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    loaded: false,
    shutChargeTips: false,
    redpock: {
      show: false,
      text: ''
    },
    imgDialog: {
      show: false,
      src: '',
      height: 0
    },
    showFixedBtn: false,
    unReadMessageNum: 0 // 未读消息数量
  }
  other = {
    click_times: {}, // 换一批点击次数
    timer: null
  }

  componentWillMount() {
    this.setData({
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
    })
    // 获取banner和栏目信息，使用promise来控制两个请求的同步
    let bannerP = this.getBanner()
    let themeP = this.getTheme()
    this.getDialogSetting()

    // 当两个请求完成之后隐藏loading
    Promise.all([bannerP, themeP]).then(results => {
      this.setData({ loaded: true })
      // 图片懒加载
      for (let i = 0; i < this.data.themes.length; i++) {
        for (let j = 0; j < this.data.themes[i].books.length; j++) {
          this.observe = Taro.createIntersectionObserver(this)
          this.observe.relativeToViewport().observe(`.img-${i}-${j}`, res => {
            if (res.intersectionRatio > 0) {
              let indexArr = res.dataset.index.split('-')
              //如果图片进入可视区，将其设置为 show
              let key1 =
                'themes[' + indexArr[0] + '].books[' + indexArr[1] + '].show'
              this.setData({ [key1]: true })
            }
          })
        }
      }
    })
  }

  componentDidShow() {
    // 使用计时器等待getAppSetting消息返回
    this.other.timer = setInterval(() => {
      if (typeof app.globalData.unReadMessages !== 'undefine') {
        clearInterval(this.other.timer)
        const hasReadMessages = Taro.getStorageSync('hasReadMessages') || []
        const unReadMessages =
          app.globalData.unReadMessages instanceof Array
            ? app.globalData.unReadMessages.filter(
                item => hasReadMessages.indexOf(item) < 0
              )
            : []
        this.setData({
          unReadMessageNum: unReadMessages.length
        })
      }
    }, 1000)
  }

  componentWillUnmount() {
    if (this.observe) this.observe.disconnect()
    if (this.other.timer) clearInterval(this.other.timer)
  }

  onShareAppMessage = res => {
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.share
    const code = app.globalData.shareCode + '|' + Date.now()
    if (shareParams && app.globalData.shareCode) {
      return {
        title: shareParams.title,
        path: shareParams.page + '?code=' + code,
        imageUrl: shareParams.imageUrl
      }
    } else {
      Taro.showToast({
        title: '获取分享参数失败',
        icon: 'none',
        duration: 2000
      })
      return false
    }
  }
  getBanner = () => {
    return new Promise((resolve, reject) => {
      Taro.request({
        url: config.base_url + '/api/banner/list',
        success: res => {
          if (res.data.ok) {
            resolve(res)
          } else {
            // 隐藏banner
            reject(res)
          }
        },
        fail: function(err) {
          reject(err)
        }
      })
    })
      .then(res => {
        this.setData({ banner_urls: res.data.list })
      })
      .catch(err => {
        this.setData({ is_show_banner: false })
        // 自动重新尝试
        setTimeout(() => {
          this.getBanner()
        }, 2000)
      })
  }
  getTheme = () => {
    return new Promise((resolve, reject) => {
      Taro.request({
        url: config.base_url + '/api/theme/index_list',
        success: res => {
          if (res.data.ok) {
            resolve(res)
          } else {
            // 隐藏banner
            reject(res)
          }
        },
        fail: function(err) {
          reject(err)
        }
      })
    })
      .then(res => {
        // 初始化换一批的点击次数
        res.data.list = res.data.list.map(item => {
          if (item.flush) {
            let tmpObj = {}
            tmpObj[item._id] = 2
            this.other.click_times = Object.assign(
              this.other.click_times,
              tmpObj
            )
          }
          item.books = item.books.map(item2 => {
            item2.show = false
            return item2
          })
          return item
        })
        this.setData({ themes: res.data.list })
      })
      .catch(err => {
        setTimeout(() => {
          this.getTheme()
        }, 2000)
      })
  }
  getDialogSetting = () => {
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/wxapp/dialog',
      success: res => {
        if (res.data.ok) {
          app.globalData.dialogSetting = res.data.dialog
          // 展示首页弹窗
          const dialog = res.data.dialog['index-dialog']
          if (dialog && dialog.type === 'normal-text') {
            Taro.showModal({
              title: dialog.title || '温馨提示',
              content: dialog.content,
              success: res => {
                if (res.confirm) {
                  Taro.setClipboardData({
                    data: dialog.copy,
                    success: () => {
                      Taro.showToast({ title: '复制成功', icon: 'success' })
                    }
                  })
                }
              }
            })
          } else if (dialog && dialog.type === 'copy-text') {
            Taro.showModal({
              title: dialog.title || '温馨提示',
              content: dialog.content,
              success: res => {
                if (res.confirm) {
                  if (dialog.jump_type !== 'none')
                    Taro.navigateTo({ url: dialog.jump_url })
                }
              }
            })
          } else if (dialog && dialog.type === 'img') {
            // TODO
            this.setData({
              'imgDialog.show': true,
              'imgDialog.src': dialog.img_url
            })
          }

          // 红包
          const redpock = res.data.dialog['redpock']
          if (redpock && redpock.redpock_des) {
            this.setData({
              'redpock.show': true,
              'redpock.text': redpock.redpock_des || '送你一个大红包！'
            })
          }

          // 悬浮框
          const fixedBtn = res.data.dialog['fixed-btn']
          if (fixedBtn && fixedBtn.img_url) {
            this.setData({
              showFixedBtn: true
            })
          }
        } else {
          Taro.showToast({
            title:
              '获取弹窗设置失败' + (res.data.msg ? '，' + res.data.msg : ''),
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '获取弹窗设置失败',
          icon: 'none',
          duration: 2000
        })
        setTimeout(function() {
          Taro.switchTab({ url: '../index/index' })
        }, 1000)
      }
    })
  }
  changeList = event => {
    let theme_id = event.currentTarget.dataset.themeid
    let page = parseInt(this.other.click_times[theme_id])
    if (theme_id) {
      Taro.request({
        url:
          config.base_url +
          '/api/theme/change_list?page=' +
          page +
          '&theme_id=' +
          theme_id,
        success: res => {
          if (res.data.ok) {
            if (res.data.list.length > 0) {
              // 局部更新
              let thisIndex = -1
              this.data.themes.forEach((item, index) => {
                if (item._id == theme_id) {
                  thisIndex = index
                }
              })
              if (thisIndex > -1) {
                let key1 = 'themes[' + thisIndex + '].books'
                this.other.click_times[theme_id] = page + 1
                this.setData({ [key1]: res.data.list })
              }
            } else {
              Taro.showToast({
                title: '暂无更多',
                icon: 'none',
                duration: 2000
              })
            }
          } else {
            // 隐藏banner
            Taro.showToast({
              title: '更新栏目失败',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function(err) {
          Taro.showToast({
            title: '更新栏目失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  }
  gotoDetail = event => {
    let bookid = event.currentTarget.dataset.bookid
    let name = event.currentTarget.dataset.name
    Taro.navigateTo({
      url: '../bookdetail/bookdetail?id=' + bookid + '&name=' + name
    })
  }
  openRedPock = () => {
    this.setData({
      'redpock.show': false
    })
    const redpock = app.globalData.dialogSetting
      ? app.globalData.dialogSetting['redpock']
      : ''
    if (redpock.jump_type !== 'none') Taro.navigateTo({ url: redpock.jump_url })
  }
  clickImgDialog = () => {
    const dialog = app.globalData.dialogSetting
      ? app.globalData.dialogSetting['index-dialog']
      : ''
    if (dialog.jump_type === 'erweima') {
      Taro.showToast({
        title: '长按即可识别二维码',
        icon: 'none',
        duration: 2000
      })
      Taro.previewImage({
        current: this.data.imgDialog.src,
        urls: [this.data.imgDialog.src]
      })
    } else if (dialog.jump_type !== 'none') {
      Taro.navigateTo({ url: dialog.jump_url })
    }
  }
  closeImgDialog = () => {
    this.setData({
      'imgDialog.show': false
    })
  }
  dialogImgLoad = event => {
    this.setData({
      'imgDialog.height': event.detail.height * (240 / event.detail.width)
    })
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '首页',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      showFixedBtn,
      redpock,
      imgDialog,
      loaded,
      is_show_banner,
      banner_urls,
      unReadMessageNum,
      themes
    } = this.state
    return (
      <Block>
        {showFixedBtn && <FixedBtn></FixedBtn>}
        {/*  红包  */}
        {redpock.show && (
          <Redpock text={redpock.text} onOpen={this.openRedPock}></Redpock>
        )}
        {/*  首页图片弹窗  */}
        {loaded && imgDialog.show && (
          <View className="img-dialog zoomIn">
            <Image
              src={imgDialog.src}
              mode="aspectFill"
              onClick={this.clickImgDialog}
              onLoad={this.dialogImgLoad}
              style={'height: ' + (imgDialog.height + 'px')}
            ></Image>
            <Icon
              type="cancel"
              color="#ffffff"
              size="36"
              onClick={this.closeImgDialog}
            ></Icon>
          </View>
        )}
        {loaded && imgDialog.show && (
          <View className="img-dialog-backdrop"></View>
        )}
        {loaded && (
          <Block>
            {themes.map((item, index) => {
              return (
                <View
                  className={
                    'container index ' +
                    (redpock.show || imgDialog.show ? 'overflow' : '')
                  }
                  scrollY="true"
                >
                  {is_show_banner && (
                    <Swiper
                      className="screen-swiper square-dot"
                      indicatorDots="true"
                      circular="true"
                      autoplay="true"
                      interval="5000"
                      duration="500"
                    >
                      {banner_urls.map((item, index) => {
                        return (
                          <Block key="item._id">
                            <SwiperItem>
                              <Navigator url={item.url}>
                                <Image
                                  src={item.img_url}
                                  className="slide-image"
                                  mode="aspectFill"
                                ></Image>
                              </Navigator>
                            </SwiperItem>
                          </Block>
                        )
                      })}
                      {/*  banner广告位  */}
                      {/*  <block>
                                           <swiper-item>
                                             <ad unit-id="adunit-1125e761df261844"></ad>
                                           </swiper-item>
                                         </block>  */}
                    </Swiper>
                  )}
                  <View className="nav">
                    <Navigator url="/pages/classify/classify">
                      <View className="nav-item">
                        <Icon
                          className="iconfont icon-fenlei"
                          style="background: #ffc539"
                        ></Icon>
                        <Text>分类</Text>
                      </View>
                    </Navigator>
                    <Navigator url="/pages/search/search">
                      <View className="nav-item">
                        <Icon
                          className="iconfont icon-sousuo"
                          style="background: #ff9654"
                        ></Icon>
                        <Text>搜索</Text>
                      </View>
                    </Navigator>
                    <Navigator url="/pages/account/account">
                      <View className="nav-item">
                        <Icon
                          className="iconfont icon-chongzhi"
                          style="background: #ff6687"
                        ></Icon>
                        <Text>账户</Text>
                      </View>
                    </Navigator>
                    <Navigator url="/pages/notice/notice">
                      <View className="nav-item">
                        <Icon
                          className="iconfont icon-xiaoxi"
                          style="background: #6db3f7"
                        ></Icon>
                        <Text>消息</Text>
                        {unReadMessageNum > 0 && (
                          <View className="bridge">{unReadMessageNum}</View>
                        )}
                      </View>
                    </Navigator>
                    {/*  <navigator url="/pages/charge/charge">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     <view class="nav-item">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       <icon class="iconfont icon-cz" style="background: #1bdb9f"></icon>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       <text>充值</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     </view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   </navigator>  */}
                    <Navigator url="/pages/attendance/attendance">
                      <View className="nav-item">
                        <Icon
                          className="iconfont icon-qiandao"
                          style="background: #1bdb9f"
                        ></Icon>
                        <Text>签到</Text>
                      </View>
                    </Navigator>
                  </View>
                  {(themes.length > 0 ? true : false) && (
                    <Block>
                      {themes.map((item, index) => {
                        return (
                          <View className="theme" key="item._id">
                            <View className="theme-title">
                              <Icon className="iconfont icon-hengxian"></Icon>
                              {item.name}
                              <Icon className="iconfont icon-hengxian"></Icon>
                              {item.flush && (
                                <View
                                  className="flush"
                                  data-themeid={item._id}
                                  onClick={this.changeList}
                                >
                                  <Text>换一批</Text>
                                  <Icon className="iconfont icon-refresh"></Icon>
                                </View>
                              )}
                            </View>
                            <View className={'layout' + item.layout}>
                              {item.books.map((bookItem, bookIndex) => {
                                return (
                                  <View
                                    className={'book-item item' + bookIndex}
                                    key="bookItem._id"
                                    data-bookid={bookItem._id}
                                    data-name={bookItem.name}
                                    onClick={this.gotoDetail}
                                  >
                                    <Image
                                      className={
                                        'book-img ' +
                                        ('img-' + index + '-' + bookIndex)
                                      }
                                      data-index={index + '-' + bookIndex}
                                      src={
                                        bookItem.show
                                          ? bookItem.img_url
                                          : 'https://fs.andylistudio.com/mbook/book-loading.svg'
                                      }
                                    ></Image>
                                    <View className="book-info">
                                      <Text className="book-name">
                                        {bookItem.name}
                                      </Text>
                                      <Text className="book-des">
                                        {bookItem.des}
                                      </Text>
                                      <View className="book-author">
                                        <Icon className="iconfont icon-hezuozuozhe"></Icon>
                                        {bookItem.author}
                                      </View>
                                    </View>
                                  </View>
                                )
                              })}
                            </View>
                            {item.flush && (
                              <Navigator url="/pages/classify/classify">
                                <View className="more" data-themeid={item._id}>
                                  查看更多>
                                </View>
                              </Navigator>
                            )}
                          </View>
                        )
                      })}
                    </Block>
                  )}
                  {/*  暂无数据  */}
                  {(themes.length == 0 ? true : false) && (
                    <NoData
                      text="暂无栏目信息"
                      subText="服务器开小差了，点击重新获取"
                      btnText="重新获取"
                      showBtn="true"
                      onBtnclick={this.getTheme}
                    >
                      <Icon className="iconfont icon-zanwushuju"></Icon>
                    </NoData>
                  )}
                </View>
              )
            })}
          </Block>
        )}
        {!loaded && (
          <View className="loading">
            <Image src="https://fs.andylistudio.com/mbook/book-loading.svg"></Image>
          </View>
        )}
      </Block>
    )
  }
}

export default _C
