import { Block, View, Image, Text, Icon, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './charge.scss'
// pages/setting/charge.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    currentPageNum: 1,
    payNum: 0,
    willGetYuebiNum: 0,
    url: '',
    localIp: '0.0.0.0',
    prises: [],
    chargeResult: {
      type: '',
      mainText: '',
      desText: '',
      mainBtnText: '',
      subBtnText: '',
      mainCallback: null,
      subCallback: null
    }
  }

  componentDidShow(options) {
    this.getChargeGood()
    // 当前页面不予许分享
    Taro.hideShareMenu()
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
  select = event => {
    let num = parseInt(event.currentTarget.dataset.num)
    let key = 'prises[' + num + '].selected'
    this.setData({ [key]: !this.data.prises[num].selected })
    let payNum = 0
    let willGetYuebiNum = 0
    this.data.prises.forEach(item => {
      if (item.selected) {
        payNum += item.prise
        willGetYuebiNum += item.yuebi
      }
    })
    this.setData({ payNum: payNum, willGetYuebiNum: willGetYuebiNum })
  }
  changePage = event => {
    let page = parseInt(event.currentTarget.dataset.page)
    this.setData({ currentPageNum: page })
  }
  getChargeGood = () => {
    let self = this
    Taro.request({
      method: 'GET',
      url: config.base_url + '/api/charge',
      success: res => {
        if (res.data.ok) {
          let prises = res.data.list.map(item => {
            item.selected = false
            return item
          })
          self.setData({ prises: prises })
        } else {
          self.showToast(
            '获取充值商品失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: err => {
        self.showToast('获取充值商品失败', 'bottom')
      }
    })
  }
  doPay = () => {
    let self = this
    // 向后端请求支付参数
    let selectPrise = self.data.prises.filter(item => {
      return item.selected
    })
    Taro.showLoading({
      title: '支付中...'
    })
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/pay',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        chargeids: selectPrise.map(item => {
          return item.id
        }),
        pay_money: self.data.payNum,
        yuebi_num: self.data.willGetYuebiNum,
        spbill_create_ip: self.data.localIp || '0.0.0.0'
      },
      success: res => {
        if (res.data.ok) {
          let pay_id = res.data.pay_id
          Taro.requestPayment({
            timeStamp: res.data.params.timeStamp,
            nonceStr: res.data.params.nonceStr,
            package: res.data.params.package,
            signType: res.data.params.signType,
            paySign: res.data.params.paySign,
            success: res => {
              Taro.hideLoading()
              // 前往支付成功页面
              self.setData({
                chargeResult: {
                  type: 'success',
                  mainText: '支付成功',
                  desText:
                    '获得' + self.data.willGetYuebiNum + '阅币，快去阅读吧~',
                  mainBtnText: '去阅读',
                  subBtnText: '再来一单',
                  mainCallback: function() {
                    Taro.switchTab({
                      url: '../booklist/booklist'
                    })
                  },
                  subCallback: function() {
                    self.setData({
                      chargeResult: {
                        type: '',
                        mainText: '',
                        desText: '',
                        mainBtnText: '',
                        subBtnText: '',
                        mainCallback: null,
                        subCallback: null
                      }
                    })
                  }
                }
              })
            },
            fail: err => {
              Taro.hideLoading()
              let errorMsg = ''
              if (err && err.errMsg) {
                if (err.errMsg.indexOf('cancel') > -1) {
                  errorMsg = '取消订单'
                  // 向后端发送支付取消请求
                  Taro.request({
                    method: 'GET',
                    url: config.base_url + '/api/pay/cancel?pay_id=' + pay_id,
                    header: { Authorization: 'Bearer ' + app.globalData.token },
                    success: res => {}
                  })
                }
                if (err.errMsg.indexOf('servicewechat.com:443') > -1) {
                  errorMsg = '请检查您的网络'
                }
              }
              // 前往支付失败页面
              self.setData({
                chargeResult: {
                  type: 'warn',
                  mainText: '支付失败',
                  desText: errorMsg,
                  mainBtnText: '重新下单',
                  subBtnText: '去阅读',
                  mainCallback: function() {
                    self.setData({
                      chargeResult: {
                        type: '',
                        mainText: '',
                        desText: '',
                        mainBtnText: '',
                        subBtnText: '',
                        mainCallback: null,
                        subCallback: null
                      }
                    })
                  },
                  subCallback: function() {
                    Taro.switchTab({
                      url: '../booklist/booklist'
                    })
                  }
                }
              })
            }
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.hideLoading()

          self.showToast('请求支付参数失败', 'bottom')
        }
      },
      fail: err => {
        Taro.hideLoading()

        self.showToast('请求支付参数失败', 'bottom')
      }
    })
  }
  btnClick = event => {
    let type = event.currentTarget.dataset.type
    if (type === 'main') {
      if (typeof this.data.chargeResult.mainCallback === 'function') {
        this.data.chargeResult.mainCallback()
      }
    } else if (type === 'sub') {
      if (typeof this.data.chargeResult.subCallback === 'function') {
        this.data.chargeResult.subCallback()
      }
    }
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '充值',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      currentPageNum,
      prises,
      payNum,
      isPaying,
      chargeResult
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <View className="container charge">
          {!chargeResult.type && (
            <View className="charge-main">
              <View className="tab">
                <View
                  className={
                    'tab-item ' + (currentPageNum === 1 ? 'active' : '')
                  }
                  data-page="1"
                  onClick={this.changePage}
                >
                  充值
                </View>
                <View
                  className={
                    'tab-item ' + (currentPageNum === 2 ? 'active' : '')
                  }
                  data-page="2"
                  onClick={this.changePage}
                >
                  充值记录
                </View>
                <View
                  className={
                    'tab-item ' + (currentPageNum === 3 ? 'active' : '')
                  }
                  data-page="3"
                  onClick={this.changePage}
                >
                  消费记录
                </View>
              </View>
              {/*  <navigator url="/pages/webpage/webpage?url=https://mbook.andylistudio.com/activity01" open-type="navigate">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <view class="notice">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <icon class="iconfont icon-tips"></icon>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <text class="text">这是一段提示文件</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </navigator>  */}
              <View className="content">
                {currentPageNum === 1 && (
                  <View className="content-item">
                    <Image
                      className="ad"
                      src="http://fs.andylistudio.com/mbook/charge/banner.png"
                    ></Image>
                    <View className="title">
                      请选择充值的阅币数量（1元兑换100阅币）:
                    </View>
                    <View className="selector">
                      {prises.map((item, index) => {
                        return (
                          <View
                            className={
                              'selector-item ' + (item.selected ? 'active' : '')
                            }
                            key="index"
                            data-num={index}
                            onClick={this.select}
                          >
                            <Text className="yuebi">{item.yuebi + '阅币'}</Text>
                            <Text className="jiage">
                              {'售价:' + item.prise + '元'}
                            </Text>
                            <Icon className="iconfont icon-xuanzhong1"></Icon>
                          </View>
                        )
                      })}
                    </View>
                    {payNum > 0 && (
                      <View className="zhifu">
                        <View className="pay-info">
                          <View className="pay-money">
                            应付
                            <Text className="red-text">
                              ￥<Text className="num">{payNum}</Text>
                            </Text>
                          </View>
                          <View className="pay-yuebi">
                            将获得<Text className="num">1000</Text>阅币
                          </View>
                        </View>
                        <Button
                          type="primary"
                          loading={isPaying}
                          onClick={this.doPay}
                        >
                          去支付
                        </Button>
                      </View>
                    )}
                  </View>
                )}
                {currentPageNum === 2 && (
                  <View className="content-item">充值记录</View>
                )}
                {currentPageNum === 3 && (
                  <View className="content-item">消费记录</View>
                )}
              </View>
            </View>
          )}
          {chargeResult.type && (
            <View className="charge-result">
              <Icon type={chargeResult.type} size="110"></Icon>
              <View className="main-text">{chargeResult.mainText}</View>
              <View className="main-des">{chargeResult.desText}</View>
              <Button type="primary" data-type="main" onClick={this.btnClick}>
                {chargeResult.mainBtnText}
              </Button>
              <Button type="default" data-type="sub" onClick={this.btnClick}>
                {chargeResult.subBtnText}
              </Button>
            </View>
          )}
        </View>
      </Block>
    )
  }
}

export default _C
