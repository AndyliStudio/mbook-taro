import { Block, View, Image, Text, Form, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../../component/fixed-btn/fixed-btn'
import Toast from '../../../component/toast/toast'
import Modal from '../../../component/modal/modal'
import './share.scss'
// pages/setting/webpage.js
const config = require('../../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: {
      show: false,
      name: '',
      inputValue: '',
      title: '温馨提示',
      opacity: 0.6,
      position: 'center',
      width: '80%',
      options: {
        fullscreen: false,
        showclose: true,
        showfooter: true,
        closeonclickmodal: true,
        confirmText: ''
      }
    },
    url: '',
    shareInfo: {
      todayAwardNum: 0,
      todayInviteNum: 0,
      totalAwardNum: 0,
      totalInviteNum: 0
    },
    awardRecords: [],
    allAwardRecords: [],
    code: '', // 邀请码
    wxcode: '', // 邀请二维码
    hasMore: true,
    page: 1,
    showSharePanel: '' // 是否展示分享面板
  }

  componentDidShow() {
    // 请求用户分享数据
    this.getUserShareInfo(true)
  }

  componentWillMount(options = this.$router.params || {}) {
    this.setData({
      code: options.code || ''
    })
  }

  openSharePanel = event => {
    app.reportFormId('share', event.detail.formId)
    this.setData({ showSharePanel: true })
  }
  closeSharePanel = () => {
    this.setData({ showSharePanel: false })
  }
  updateShareLog = share_id => {
    let self = this
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/share/update?share_id=' + share_id,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          Taro.showToast({ title: '获得15书币的奖励', icon: 'success' })
          setTimeout(function() {
            Taro.hideToast()
          }, 2000)
          // 修改奖励数量
          let today = new Date()
          let year = today.getFullYear()
          let month = today.getMonth + 1
          month = month > 9 ? month : '0' + month
          let day = today.getDate()
          day = day > 9 ? day : '0' + day
          self.setData({
            'shareInfo.todayAwardNum': self.data.shareInfo.todayAwardNum + 15,
            'shareInfo.totalAwardNum': self.data.shareInfo.totalAwardNum + 15,
            awardRecords: self.data.awardRecords.unshift({
              name: app.globalData.userinfo.username,
              type: '接收邀请',
              time: year + '/' + month + '/' + day
            })
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          if (res.data.inviteself) {
            return false
          }
          self.showToast(res.data.msg || '接收邀请失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('接收邀请失败', 'bottom')
        // 自动重新尝试
        setTimeout(function() {
          self.updateShareLog(share_id)
        }, 2000)
      }
    })
  }
  getUserShareInfo = () => {
    let self = this
    Taro.showLoading({ title: '数据加载中' })
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/share/info',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        Taro.hideLoading()
        if (res.data.ok) {
          let records = []
          if (
            res.data.award_records &&
            res.data.award_records instanceof Array
          ) {
            records = res.data.award_records.slice(
              (self.data.page - 1) * 5,
              self.data.page * 5
            )
          }
          // 根据时间排序
          records.sort((item1, item2) => {
            let time1 = new Date(item1.time)
            let time2 = new Date(item2.time)
            return time2.getTime() - time1.getTime()
          })
          self.setData({
            shareInfo: res.data.shareInfo,
            allAwardRecords: res.data.award_records || [],
            awardRecords: records
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取奖励信息失败', 'bottom')
        }
      },
      fail: err => {
        Taro.hideLoading()

        self.showToast('获取奖励信息失败', 'bottom')
      }
    })
  }
  lookMore = () => {
    let self = this
    let page = self.data.page
    if (page * 5 <= self.data.allAwardRecords.length) {
      page++
      self.setData({
        awardRecords: self.data.awardRecords.concat(
          self.data.allAwardRecords.slice((page - 1) * 5, page * 5)
        ),
        page: page,
        hasMore: page * 5 < self.data.allAwardRecords.length
      })
    } else {
      self.setData({ hasMore: false })
    }
  }
  onShareAppMessage = res => {
    let self = this
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
      self.showToast('获取分享参数失败', 'bottom')
      return false
    }
  }
  gotoIndex = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }
  handleShareModalClose = () => {
    this.setData({
      modal: {
        show: false,
        name: '',
        inputValue: '',
        title: '温馨提示',
        opacity: 0.6,
        position: 'center',
        width: '80%',
        options: {
          fullscreen: false,
          showclose: true,
          showfooter: true,
          closeonclickmodal: true,
          confirmText: ''
        }
      }
    })
  }
  handleShareModalConfirm = () => {
    let self = this
    Taro.downloadFile({
      url: self.data.wxcode, //仅为示例，并非真实的资源
      success: function(res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          Taro.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function(res) {
              Taro.showToast({ title: '保存图片成功', icon: 'success' })
              self.handleShareModalClose()
              setTimeout(function() {
                Taro.hideToast()
              }, 2000)
            },
            fail: function(err) {
              self.showToast('保存图片失败', 'bottom')
            }
          })
        } else {
          self.showToast('下载图片失败', 'bottom')
        }
      }
    })
  }
  getWxCode = () => {
    let self = this
    if (app.globalData.shareCode) {
      if (self.data.wxcode) {
        self.setData({
          modal: {
            show: true,
            title: '温馨提示',
            content: '',
            opacity: 0.6,
            position: 'center',
            width: '80%',
            options: {
              fullscreen: false,
              showclose: true,
              showfooter: true,
              closeonclickmodal: true,
              confirmText: '下载二维码'
            }
          }
        })
      } else {
        Taro.showLoading({ title: '正在生成二维码' })
        Taro.request({
          url:
            config.base_url +
            '/api/get_share_img?share_type=friendQ&share_id=' +
            app.globalData.shareCode +
            '|' +
            Date.now(),
          header: { Authorization: 'Bearer ' + app.globalData.token },
          success: res => {
            if (res.data.ok) {
              self.setData({ wxcode: res.data.img_url })
              self.closeSharePanel()
              setTimeout(function() {
                Taro.hideLoading()
                self.setData({
                  modal: {
                    show: true,
                    title: '温馨提示',
                    content: '',
                    opacity: 0.6,
                    position: 'center',
                    width: '80%',
                    options: {
                      fullscreen: false,
                      showclose: true,
                      showfooter: true,
                      closeonclickmodal: true,
                      confirmText: '下载二维码'
                    }
                  }
                })
              }, 1000)
            } else if (res.data.authfail) {
              Taro.navigateTo({
                url: '../../loading/loading?need_login_again=1'
              })
            } else {
              self.showToast('获取分享朋友圈二维码失败', 'bottom')
            }
          },
          fail: err => {
            self.showToast('获取分享朋友圈二维码失败', 'bottom')
          }
        })
      }
    } else {
      self.showToast('获取邀请码失败', 'bottom')
    }
  }
  openShare = event => {
    if (event.currentTarget.dataset.type === 'friend') {
      this.closeSharePanel()
      Taro.showShareMenu({
        withShareTicket: false
      })
    } else if (event.currentTarget.dataset.type === 'friendQ') {
      this.getWxCode()
    }
  }
  pasteWxCode = () => {
    let self = this
    Taro.setClipboardData({
      data: self.data.shareText,
      success: function(res) {
        Taro.showToast({ title: '复制成功', icon: 'success' })
        setTimeout(function() {
          Taro.hideToast()
        }, 2000)
      }
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
    navigationBarTitleText: '分享有礼',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      modal,
      wxcode,
      shareInfo,
      hasMore,
      awardRecords,
      showSharePanel
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <Modal
          className="share-modal"
          data-model="modal.show"
          hidden={!modal || !modal.show}
          visible={modal.show}
          title={modal.title}
          position={modal.position}
          fullscreen={modal.options.fullscreen}
          opacity={modal.opacity}
          showClose={modal.options.showclose}
          showFooter={modal.options.showfooter}
          closeOnClickModal={modal.options.closeonclickmodal}
          confirmText={modal.options.confirmText}
          onClose={this.handleShareModalClose}
          onConfirm={this.handleShareModalConfirm}
        >
          <View className="des">
            请点击下载此二维码，并使用此二维码作为图片发送到朋友圈
          </View>
          <Image
            className="share-img"
            src={wxcode}
            alt="二维码加载中..."
          ></Image>
        </Modal>
        <View className="share-page">
          <View className="card">
            <View className="card-title">我的奖励</View>
            <View className="right-shut"></View>
            {/*  <view class="info">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <text class="label">今日获得书币: </text><text class="padding">{{shareInfo.todayAwardNum}}</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <text class="label second">累计获得的书币: </text><text class="padding">{{shareInfo.totalAwardNum}}</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </view>  */}
            <View className="info">
              <View className="left">
                累计获得的书币:
                <Text className="padding">
                  {shareInfo.totalAwardNum + '个'}
                </Text>
              </View>
              <View className="right">
                累计邀请人数:
                <Text className="padding">
                  {shareInfo.totalInviteNum + '人'}
                </Text>
              </View>
            </View>
            <View className="operation">
              <Form
                className="share-btn"
                onSubmit={this.openSharePanel}
                reportSubmit="true"
              >
                <Button className="inner-btn" formType="submit">
                  去分享
                </Button>
              </Form>
              <Button className="back-btn" onClick={this.gotoIndex}>
                回到首页
              </Button>
            </View>
            <View className="rule">
              <View className="circle left-circle"></View>
              <View className="circle right-circle"></View>
              <View className="text">
                1. 每天登陆后可以签到得到5书币，连续签到会有额外奖励；
              </View>
              <View className="text">2. 邀请好友一次登录获得15书币；</View>
              <View className="text">3. 每天获得书币的最大上限为200；</View>
              <View className="text">
                4. 本活动的最终解释权归美景阅读所有；
              </View>
            </View>
          </View>
          <View className="card secord">
            <View className="card-title">奖励记录</View>
            <View className="right-shut"></View>
            <View className="table">
              <View className="row yellow">
                <View className="row-item one">序号</View>
                <View className="row-item two">用户</View>
                <View className="row-item three">类型</View>
                <View className="row-item four">时间</View>
              </View>
              <View className="bodys">
                {awardRecords.length > 0 ? (
                  <Block>
                    {awardRecords.map((item, index) => {
                      return (
                        <View className="row" key="index">
                          <View className="row-item one">{index + 1}</View>
                          <View className="row-item two">{item.name}</View>
                          <View className="row-item three">{item.type}</View>
                          <View className="row-item four">{item.time}</View>
                        </View>
                      )
                    })}
                    {hasMore ? (
                      <View className="look-more" onClick={this.lookMore}>
                        查看更多
                      </View>
                    ) : (
                      <View className="no-more">暂无更多数据</View>
                    )}
                  </Block>
                ) : (
                  <Block>
                    <View className="no-data">暂无奖励记录</View>
                  </Block>
                )}
              </View>
            </View>
          </View>
          {/*  广告模块  */}
          {/*  <view class="bottom">
                                                                                                                                                                                                                                                  <ad  unit-id="adunit-016adb84b1e83807"></ad>
                                                                                                                                                                                                                                                </view>  */}
          {/*  分享面板  */}
          {showSharePanel && (
            <View className="share-panel">
              <View className="modal" onClick={this.closeSharePanel}></View>
              <View className={'panel ' + (showSharePanel ? 'show' : '')}>
                <View className="title">分享即可获得书币</View>
                <View className="container">
                  <Button className="panel-item" openType="share">
                    <View className="icon-friend"></View>
                    <View className="text">微信好友</View>
                  </Button>
                  <Button
                    className="panel-item"
                    data-type="friendQ"
                    onClick={this.openShare}
                  >
                    <View className="icon-friendQ"></View>
                    <View className="text">朋友圈</View>
                  </Button>
                  {/*  <button class="panel-item" data-type="qq">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               <view class="icon-qq"></view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               <view class="text">其他</view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             </button>  */}
                </View>
              </View>
            </View>
          )}
        </View>
      </Block>
    )
  }
}

export default _C
