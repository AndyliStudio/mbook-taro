import { Block, View, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Modal from '../../component/modal/modal'
import LazyloadImg from '../../component/lazyload-img/lazyload-img'
import Toast from '../../component/toast/toast'
import './account.scss'
// pages/user/user.js
const config = require('../../config.js')
const util = require('../../utils/util.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    modal: {
      show: false,
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
    wxcode: '',
    currentPageNum: 1,
    amount: 0,
    awards: [],
    buys: [],
    showBuyLoadmore: false,
    showAwardLoadmore: false,
    awardPage: 1,
    buyPage: 1,
    chargeTips: '',
    shutChargeTips: false
  }

  componentDidShow() {
    this.getInfo()
  }

  componentWillMount() {
    let chargeTips =
      app.globalData.globalSetting.charge_tips ||
      '暂不支持微信支付，请加客服(haitianyise_hl)为好友，按照1元兑换10书币的价格转账之后，客服人员会为您添加书币。'
    this.setData({
      wxcode: app.globalData.globalSetting.wxcode || 'haitianyise_hl',
      chargeTips: chargeTips,
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
    })
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  changePage = event => {
    let page = parseInt(event.currentTarget.dataset.page)
    this.setData({ currentPageNum: page })
  }
  getInfo = () => {
    let self = this
    const amount = app.globalData.userInfo.amount
    if (amount || amount === 0) {
      self.setData({ amount: amount })
      Taro.setStorageSync('amount', amount)
    } else {
      self.getAmount()
    }
    self.getAward()
    self.getBuys()
  }
  getBuys = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/buy/list?page=' + self.data.awardPage,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            buys: self.data.buys.concat(
              res.data.list.map(item => {
                item.create_time = util.formatTime(new Date(item.create_time))
                return item
              })
            )
          })
          self.setData({
            showBuyLoadmore:
              self.data.buys.length >= res.data.total ? false : true
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取奖励记录失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取奖励记录失败', 'bottom')
      }
    })
  }
  getAward = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/award/list?page=' + self.data.buyPage,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            awards: self.data.awards.concat(
              res.data.list.map(item => {
                item.create_time = util.formatTime(new Date(item.create_time))
                return item
              })
            )
          })
          self.setData({
            showAwardLoadmore:
              self.data.awards.length >= res.data.total ? false : true
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取奖励记录失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取奖励记录失败', 'bottom')
      }
    })
  }
  getAmount = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/user/amount',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ amount: res.data.data.amount })
          app.globalData.amount = res.data.data.amount
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取书币数量失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取书币数量失败', 'bottom')
      }
    })
  }
  copyWxcode = () => {
    let self = this
    Taro.setClipboardData({
      data: self.data.wxcode,
      success: function(res) {
        Taro.showToast({ title: '复制成功', icon: 'success' })
        self.setData({
          'modal.show': false
        })
        setTimeout(function() {
          Taro.hideToast()
        }, 2000)
      }
    })
  }
  loadMore = event => {
    let page = parseInt(event.currentTarget.dataset.page)
    if (page === 1) {
      this.setData({ awardPage: this.data.awardPage + 1 })
      this.getAward()
    } else if (page === 2) {
      this.setData({ buyPage: this.data.buyPage + 1 })
      this.getBuys()
    }
  }
  gotoCharge = () => {
    this.setData({
      modal: {
        show: true,
        title: '温馨提示',
        opacity: 0.6,
        position: 'center',
        width: '80%',
        options: {
          fullscreen: false,
          showclose: true,
          showfooter: false,
          closeonclickmodal: true,
          confirmText: ''
        }
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
    navigationBarTitleText: '我的账户',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      modal,
      chargeTips,
      amount,
      currentPageNum,
      awards,
      showAwardLoadmore,
      buys,
      showBuyLoadmore
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <Modal
          className="charge-modal"
          data-model="modal.show"
          visible={modal.show}
          title={modal.title}
          position={modal.position}
          fullscreen={modal.options.fullscreen}
          opacity={modal.opacity}
          showClose={modal.options.showclose}
          showFooter={modal.options.showfooter}
          closeOnClickModal={modal.options.closeonclickmodal}
          confirmText={modal.options.confirmText}
          onConfirm={this.handleModalConfirm}
        >
          <View>
            <View className="des">{chargeTips}</View>
            <Button className="contact-btn" onClick={this.copyWxcode}>
              复制客服微信
            </Button>
          </View>
        </Modal>
        <View className="account">
          <View className="panel">
            <View className="main-text">
              <Text className="num">{amount}</Text>书币
            </View>
            {/*  <button class="charge-btn" bindtap="gotoCharge" wx:if="{{!shutChargeTips}}">充值</button>  */}
          </View>
          <View className="tab">
            <View
              className={'tab-item ' + (currentPageNum === 1 ? 'active' : '')}
              data-page="1"
              onClick={this.changePage}
            >
              奖励和获赠
            </View>
            <View
              className={'tab-item ' + (currentPageNum === 2 ? 'active' : '')}
              data-page="2"
              onClick={this.changePage}
            >
              消费记录
            </View>
          </View>
          <View className="content">
            {currentPageNum === 1 && (
              <Block>
                {awards.map((item, index) => {
                  return (
                    <View className="content-item">
                      {awards.length > 0 && (
                        <Block>
                          {awards.map((item, index) => {
                            return (
                              <View className="award-item" key={index}>
                                <View className="award-num">
                                  <Text className="right">+</Text>
                                  {item.amount}
                                </View>
                                <View className="award-des">{item.des}</View>
                                <View className="award-time">
                                  {item.create_time}
                                </View>
                              </View>
                            )
                          })}
                        </Block>
                      )}
                      {showAwardLoadmore && (
                        <View
                          className="loadmore"
                          data-page="1"
                          onClick={this.loadMore}
                        >
                          加载更多>>
                        </View>
                      )}
                      {!awards.length && (
                        <View className="no-data">暂无奖励记录</View>
                      )}
                    </View>
                  )
                })}
              </Block>
            )}
            {currentPageNum === 2 && (
              <Block>
                {buys.map((item, index) => {
                  return (
                    <View className="content-item">
                      {buys.length > 0 && (
                        <Block>
                          {buys.map((item, index) => {
                            return (
                              <View className="buy-item" key={index}>
                                <LazyloadImg
                                  className="book-img"
                                  src={item.img_url}
                                ></LazyloadImg>
                                <View className="buy-num">
                                  <Text className="right">-</Text>
                                  {item.amount}
                                </View>
                                <View className="buy-des">
                                  {'购买书名: ' + item.book_name}
                                </View>
                                <View className="buy-des">
                                  {'购买章节: 第' + item.chapter_num + '章'}
                                </View>
                                <View className="buy-des time">
                                  {'时间: ' + item.create_time}
                                </View>
                              </View>
                            )
                          })}
                        </Block>
                      )}
                      {showBuyLoadmore && (
                        <View
                          className="loadmore"
                          data-page="2"
                          onClick={this.loadMore}
                        >
                          加载更多>>
                        </View>
                      )}
                      {!buys.length && (
                        <View className="no-data">暂无消费记录</View>
                      )}
                    </View>
                  )
                })}
              </Block>
            )}
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
