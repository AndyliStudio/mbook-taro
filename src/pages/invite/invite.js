import { Block, View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Modal from '../../component/modal/modal'
import Toast from '../../component/toast/toast'
import './invite.scss'
// pages/user/user.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    fhcode: '', // 好友助力分享ID
    info: {
      success: false,
      has_finished: 0,
      create_time: new Date(),
      left_time: '00 天 00 小时 00 分',
      book: {
        id: '',
        need_num: 0,
        limit_time: 1,
        name: '',
        author: '',
        img_url: ''
      },
      user: {
        username: '某某',
        avatar: ''
      }
    },
    recordLoading: false,
    showRecords: false,
    finishHelpIt: false,
    isSelf: false,
    records: [] // 好友助力记录
  }

  componentWillMount(options = this.$router.params || {}) {
    this.setData({
      fhcode: options.fhcode || '',
      currentUserId: app.globalData.userInfo._id
    })
    this.getFriendHelpInfo()
  }

  onShareAppMessage = () => {
    let self = this
    // 获取分享出去的图片地址
    const shareParams = app.globalData.globalSetting.friend_help_share
    let title = shareParams.title
    if (title.indexOf('{need_num}') > -1) {
      title = title.replace('{need_num}', self.data.info.book.need_num)
    }
    if (title.indexOf('{name}') > -1) {
      title = title.replace('{name}', self.data.info.book.name)
    }
    if (shareParams) {
      return {
        title: title,
        path: shareParams.page + '?fhcode=' + self.data.fhcode,
        imageUrl: shareParams.imageUrl
      }
    } else {
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }
  }
  getFriendHelpInfo = () => {
    let self = this
    // 获取当前书籍的助力ID
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/info',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          res.data.data.half_num = Math.ceil(res.data.data.book.need_num / 2)
          res.data.data.present =
            parseInt(
              (res.data.data.has_finished * 100) / res.data.data.book.need_num
            ) + '%'
          if (res.data.data.success) {
            res.data.data.status = 1
          } else {
            let now = new Date()
            let limitTime =
              res.data.data.book.limit_time > 0
                ? parseInt(res.data.data.book.limit_time)
                : 0
            let endDate = new Date(
              res.data.data.create_time + limitTime * 24 * 60 * 60 * 1000
            )
            if (now.getTime() > endDate.getTime()) {
              res.data.data.status = 2
            } else {
              res.data.data.status = 3
            }
          }
          let isSelf = false
          if (app.globalData.userInfo._id === res.data.data.userid) {
            isSelf = true
          }
          self.setData({ info: res.data.data, isSelf: isSelf })
        } else {
          self.showToast(
            '获取好友助力信息失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: function(err) {
        console.warn(err)

        self.showToast('获取好友助力信息失败', 'bottom')
      }
    })
  }
  lookRecords = () => {
    let self = this
    self.setData({ recordLoading: true })
    // 获取好友助力记录
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/records',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          let colors = ['#3fb8af', '#7fc7af', '#ffd188', '#ff9e9d', '#bf6374']
          for (let i = 0; i < res.data.lists.length; i++) {
            res.data.lists[i].color = colors[i % 5]
          }
          if (res.data.lists.length <= 4) {
            let length = 5 - res.data.lists.length
            for (let j = 0; j < length; j++) {
              res.data.lists.push({
                color: colors[(res.data.lists.length + j) % 5]
              })
            }
          }
          self.setData({
            records: res.data.lists,
            recordLoading: false,
            showRecords: true
          })
        } else {
          self.setData({ recordLoading: false, showRecords: false })

          self.showToast(
            '获取好友助力记录失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: function(err) {
        console.warn(err)
        self.setData({ recordLoading: false, showRecords: false })

        self.showToast('获取好友助力记录失败', 'bottom')
      }
    })
  }
  closeDialog = () => {
    this.setData({ showRecords: false })
  }
  helpIt = () => {
    let self = this
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/friend_help/accept',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhcode: self.data.fhcode
      },
      success: function(res) {
        if (res.data.ok) {
          self.getFriendHelpInfo()
          self.setData({ finishHelpIt: true })
          Taro.showToast({ title: '助力成功', icon: 'success' })
        } else {
          self.showToast(
            '助力失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: function(err) {
        console.warn(err)

        self.showToast('助力失败', 'bottom')
      }
    })
  }
  gotoIndex = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }
  gotoReader = () => {
    Taro.navigateTo({
      url: '/pages/bookdetail/bookdetail?id=' + this.data.info.book.id
    })
  }
  showToast = (content, position) => {
    let self = this
    self.setData({
      toast: { show: true, content: content, position: position }
    })
    setTimeout(function() {
      self.setData({ toast: { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '好友助力',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      showRecords,
      info,
      finishHelpIt,
      isSelf,
      recordLoading,
      records
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <View className={'invite ' + (showRecords ? 'overflow' : '')}>
          <View className="container">
            <View className="pic-wrap"></View>
            {/*  文字描述 start  */}
            <View className="desc-wrap">
              <View className="desc">
                <Text className="content">
                  {info.user.username +
                    '发起了助力活动，集齐' +
                    info.book.need_num +
                    '个好友的助力能量，就能免费阅读书籍《' +
                    info.book.name +
                    '》。小伙伴们快快给力啊~'}
                </Text>
              </View>
            </View>
            {/*  文字描述 end  */}
            {/*  计时器和进度条 start  */}
            <View className="time-progress" id="timeProgress">
              <View className="countdown-wrap">
                <View className="countdown" id="countDown">
                  <Text className="left"></Text>
                  <Text className="time">
                    {'还剩：' + (info.left_time || '00 天 00 小时 00 分')}
                  </Text>
                  <Text className="right"></Text>
                </View>
                {/*  进度条  */}
                <View className="progress-wrap">
                  <View className="fix">
                    <View className="progress">
                      <View
                        className="inner"
                        style={'width: ' + info.present + ';'}
                      ></View>
                    </View>
                    <View className="bubble" style="left: 0%;">
                      <View className="wrap">
                        已完成
                        <Text className="number">{info.has_finished}</Text>个
                      </View>
                      <View className="bottom"></View>
                    </View>
                    <Text className="middle">{info.half_num + '个'}</Text>
                    <Text className="complete">
                      {info.book.need_num + '个'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {/*  计时器和进度条 end  */}
            {/*  任务状态 start  */}
            <View className="task-status">
              {info.status === 1 && (
                <Block>
                  <Image src="https://fs.andylistudio.com/1539488338035.png"></Image>
                  <View>该好友助力任务已完成!</View>
                </Block>
              )}
              {info.status === 2 && (
                <Block>
                  <Image src="https://fs.andylistudio.com/1539489267437.png"></Image>
                  <View>
                    抱歉，由于未能在指定时间内完成分享助力，该任务已经过期。
                  </View>
                </Block>
              )}
            </View>
            {/*  任务状态 end  */}
            {/*  按钮组 start  */}
            <View className="btn-wrap">
              {info.status === 3 && !finishHelpIt && (
                <View className="main-btn" onClick={this.helpIt}>
                  助力
                </View>
              )}
              {((info.status !== 3 && info.status !== 1) || finishHelpIt) && (
                <Button className="share-btn" openType="share">
                  {isSelf === 4 ? '去分享' : '帮TA分享'}
                </Button>
              )}
              {info.status === 1 && isSelf && (
                <Button className="share-btn" onClick={this.gotoReader}>
                  去阅读
                </Button>
              )}
              <View
                className="rank-list"
                onClick={this.lookRecords}
                loading={recordLoading}
              >
                助力动态
              </View>
              <View className="index-btn" onClick={this.gotoIndex}>
                返回首页
              </View>
            </View>
            {/*  按钮组 end  */}
          </View>
        </View>
        {/*  助力记录弹窗 start */}
        {showRecords && (
          <View className="dialog">
            <View className="mask"></View>
            <View className="content">
              <View className="close" onClick={this.closeDialog}></View>
              <Image src="https://fs.andylistudio.com/1539619838436.png"></Image>
              <View className="lists">
                {records.map((item, index) => {
                  return (
                    <View
                      className="list-item"
                      key={index}
                      style={'background: ' + item.color}
                    >
                      {item.name && (
                        <Block>
                          <Image src={item.avatar}></Image>
                          <View className="list-info">
                            <View className="name">{item.name}</View>
                            <View className="time">{item.time}</View>
                          </View>
                        </Block>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
        )}
        {/*  助力记录弹窗 end */}
      </Block>
    )
  }
}

export default _C
