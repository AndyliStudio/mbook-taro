import { Block, View, ScrollView, Icon, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import NoData from '../../component/nodata/nodata'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './notice.scss'
// pages/notice/notice.js
const config = require('../../config.js')
const utils = require('../../utils/util.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    notices: [],
    curNoticePage: 1,
    noticeTotal: 0,
    showEndLine: false,
    comments: [],
    showType: 0,
    systemNoticeCount: 0,
    replyCommentCount: 0
  }
  other = {
    noticeLoaded: false,
    commentLoaded: false
  }
  getData = num => {
    Taro.showLoading({ title: '数据加载中' })
    if (this.data.showType === 0) {
      // 获取通知
      const page = num || this.data.curNoticePage
      const hasReadMessages = Taro.getStorageSync('hasReadMessages') || []
      Taro.request({
        url: config.base_url + '/api/wxapp/notice?page=' + page,
        header: { Authorization: 'Bearer ' + app.globalData.token },
        method: 'GET',
        success: res => {
          Taro.hideLoading()
          if (res.data.ok) {
            const notices = this.data.notices.slice()
            let newNotices = notices.concat(
              res.data.list.map(item => {
                item.time = utils.formatTime(new Date(item.create_time))
                item.name = ''
                switch (item.type) {
                  case 'update':
                    item.name = '书籍更新通知'
                    break
                  case 'system':
                    item.name = '系统消息'
                    break
                  default:
                    break
                }
                item.hasRead = hasReadMessages.indexOf(item._id) > -1
                return item
              })
            )
            if (!num) {
              newNotices = newNotices.sort(
                (item1, item2) => item1.hasRead - item2.hasRead
              )
            }
            this.setData({
              curNoticePage: page,
              noticeTotal: res.data.total,
              systemNoticeCount: res.data.total,
              notices: newNotices
            })
            this.other.noticeLoaded = true
          } else if (res.data.authfail) {
            Taro.navigateTo({ url: '../loading/loading?need_login_again=1' })
          } else {
            Taro.showToast({
              title: '获取消息失败',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: err => {
          Taro.hideLoading()
          Taro.showToast({
            title: '获取消息失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      // 获取评论回复
      Taro.request({
        url: config.base_url + '/api/comment/my',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        method: 'GET',
        success: res => {
          Taro.hideLoading()
          if (res.data.ok) {
            this.setData({
              replyCommentCount: res.data.reply.length,
              comments: res.data.reply.map(item => {
                item.time = utils.formatTime(new Date(item.time))
                return item
              })
            })
            this.other.commentLoaded = true
          } else if (res.data.authfail) {
            Taro.navigateTo({ url: '../loading/loading?need_login_again=1' })
          } else {
            Taro.showToast({
              title: '获取评论失败',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: err => {
          Taro.hideLoading()
          Taro.showToast({
            title: '获取评论失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  }
  getNextPage = () => {
    if (this.data.curNoticePage * 10 >= this.data.noticeTotal) {
      if (!this.data.showEndLine) {
        // wx.showToast({ title: '没有更多消息了~', icon: 'none', duration: 2000 })
        this.setData({ showEndLine: true })
      }
      return
    }
    const num = this.data.curNoticePage + 1
    this.getData(num)
  }

  componentWillMount() {
    this.getData()
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  onPullDownRefresh = () => {
    this.setData({ notices: [], comments: [] })
    this.getData()
    // 停止下拉刷新
    setTimeout(() => {
      Taro.stopPullDownRefresh()
    }, 400)
  }
  switchTab = event => {
    const type = event.currentTarget.dataset.type
    this.setData({
      showType: type
    })
    if (type === 0 && !this.other.noticeLoaded) {
      this.getData()
    } else if (type === 1 && !this.other.commentLoaded) {
      this.getData()
    }
  }
  gotoBookDetail = event => {
    const bookid = event.currentTarget.dataset.bookid
    if (bookid) {
      Taro.navigateTo({
        url: '../bookdetail/bookdetail?id=' + bookid
      })
    }
  }
  clickNotice = event => {
    const id = event.currentTarget.dataset.id
    console.log('id')
    const notice = this.data.notices.filter(item => item._id === id)[0]
    // 已阅读
    const hasReadMessages = Taro.getStorageSync('hasReadMessages') || []
    if (hasReadMessages.indexOf(id) < 0) {
      hasReadMessages.push(id)
      Taro.setStorageSync('hasReadMessages', hasReadMessages)
    }
    if (notice.type === 'system') {
      Taro.navigateTo({
        url:
          '../webpage/webpage?url=https://mbook.andylistudio.com/notice-detail/' +
          id
      })
    } else if (notice.type === 'update') {
      Taro.navigateTo({
        url: '../bookdetail/bookdetail?id=' + notice.bookid
      })
    }
  }
  config = {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '我的消息',
    navigationBarTextStyle: 'white',
    enablePullDownRefresh: true
  }

  render() {
    const {
      showType,
      systemNoticeCount,
      replyCommentCount,
      notices,
      comments
    } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="notice">
          <View className="h">
            <View
              className={'item ' + (showType === 0 ? 'active' : '')}
              data-type={0}
              onClick={this.switchTab}
            >
              <View className="txt">
                {'系统通知' +
                  (systemNoticeCount ? '(' + systemNoticeCount + ')' : '')}
              </View>
            </View>
            <View
              className={'item ' + (showType === 1 ? 'active' : '')}
              data-type={1}
              onClick={this.switchTab}
            >
              <View className="txt">
                {'评论回复' +
                  (replyCommentCount ? '(' + replyCommentCount + ')' : '')}
              </View>
            </View>
          </View>
          {showType == 0 && (
            <ScrollView
              className="b"
              scrollY="true"
              owerThreshold="100"
              onScrollToLower={this.getNextPage}
            >
              {notices.map((item, index) => {
                return (
                  <View
                    className="item"
                    key={item.commentid}
                    data-id={item._id}
                    onClick={this.clickNotice}
                  >
                    <View className="info">
                      <View className="user">
                        {item.type === 'system' && (
                          <Icon
                            className={item.hasRead ? 'read' : ''}
                            className="iconfont icon-notice"
                          ></Icon>
                        )}
                        {item.type === 'update' && (
                          <Icon className="iconfont icon-yuedu"></Icon>
                        )}
                        <Text className={item.hasRead ? 'read' : ''}>
                          {item.title}
                        </Text>
                      </View>
                      <View className="time">{item.time}</View>
                    </View>
                    <View className={'comment ' + (item.hasRead ? 'read' : '')}>
                      {item.preview || '暂无内容'}
                    </View>
                  </View>
                )
              })}
              {(notices.length == 0 ? true : false) && (
                <NoData text="暂无通知" subText btnText showBtn={false}>
                  <Icon className="iconfont icon-zanwushuju"></Icon>
                </NoData>
              )}
              <View className="no-more">到底了，没有更多消息了~</View>
            </ScrollView>
          )}
          {showType == 1 && (
            <ScrollView className="b" scrollY={true}>
              {comments.map((item, index) => {
                return (
                  <View
                    className="item"
                    key={item.commentid}
                    data-bookid={item.bookid}
                    onClick={this.gotoBookDetail}
                  >
                    <View className="info">
                      <View className="user">
                        <Image src={item.avatar}></Image>
                        <Text>{item.name}</Text>
                      </View>
                      <View className="time">{item.time}</View>
                    </View>
                    <View className="comment">{item.content}</View>
                  </View>
                )
              })}
              {(comments.length == 0 ? true : false) && (
                <NoData text="暂无消息" subText btnText showBtn={false}>
                  <Icon className="iconfont icon-zanwushuju"></Icon>
                </NoData>
              )}
            </ScrollView>
          )}
        </View>
      </Block>
    )
  }
}

export default _C
