import {
  Block,
  View,
  Image,
  Icon,
  Text,
  Navigator,
  Button
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './user.scss'
// pages/user/user.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userInfo: null,
    amount: 0,
    text: '',
    shutChargeTips: false
  }

  componentDidShow() {
    this.getInfo()
  }

  componentWillMount() {
    // 获取屏幕高度
    this.setData({
      userInfo: app.globalData.userInfo,
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false
    })
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getInfo = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/user/amount',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            text: res.data.data.text,
            amount: res.data.data.amount
          })
          Taro.setStorageSync('amount', res.data.data.amount)
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取个人信息失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取个人信息失败', 'bottom')
      }
    })
  }
  copyUserId = () => {
    let self = this
    Taro.setClipboardData({
      data: self.data.userInfo._id,
      success: function(res) {
        Taro.showToast({ title: '复制ID成功', icon: 'success' })
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
    navigationBarTitleText: '个人中心',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { userInfo, shutChargeTips, amount, text } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="container user">
          <View className="user-info">
            <Image
              className="avatar"
              src={userInfo.avatar}
              onClick={this.copyUserId}
            ></Image>
            <View className="info">
              <View className="username">{userInfo.username}</View>
              <View className="amount">
                {shutChargeTips ? (
                  <Block>暂无描述</Block>
                ) : (
                  <Block>
                    <Icon className="iconfont icon-qianbi"></Icon>
                    <Text className="num">{amount}</Text>书币
                  </Block>
                )}
              </View>
            </View>
            <View className="des">点击头像可复制用户ID</View>
            <View className="word">{text}</View>
          </View>
          <View className="other">
            <Navigator url="/pages/aboutus/aboutus" openType="navigate">
              <View className="about-us">
                <Icon className="iconfont icon-guanyuwomen"></Icon>
                <Text className="about-us-text">关于我们</Text>
                <Icon className="iconfont icon-arrow-right"></Icon>
              </View>
            </Navigator>
            <Button className="feedback" openType="feedback">
              <View className="about-us">
                <Icon className="iconfont icon-yijianfankui"></Icon>
                <Text className="about-us-text">意见反馈</Text>
                <Icon className="iconfont icon-arrow-right"></Icon>
              </View>
            </Button>
            <View className="main">
              <Navigator url="/pages/notice/notice" openType="navigate">
                <View className="main-item">
                  <Icon className="iconfont icon-xiaoxi"></Icon>
                  <Text className="main-text">消息</Text>
                  <View className="border left"></View>
                </View>
              </Navigator>
              {shutChargeTips ? (
                <Block>
                  <Navigator url="/pages/classify/classify" openType="navigate">
                    <View className="main-item">
                      <Icon className="iconfont icon-fenlei"></Icon>
                      <Text className="main-text">分类</Text>
                      <View className="border bottom"></View>
                    </View>
                  </Navigator>
                </Block>
              ) : (
                <Block>
                  <Navigator url="/pages/account/account" openType="navigate">
                    <View className="main-item">
                      <Icon className="iconfont icon-chongzhi"></Icon>
                      <Text className="main-text">账户</Text>
                      <View className="border bottom"></View>
                    </View>
                  </Navigator>
                </Block>
              )}
              <Navigator url="/pages/attendance/attendance" openType="navigate">
                <View className="main-item">
                  <Icon className="iconfont icon-qiandao"></Icon>
                  <Text className="main-text">签到</Text>
                  <View className="border top"></View>
                </View>
              </Navigator>
              <Navigator url="/pages/readtime/readtime" openType="navigate">
                <View className="main-item">
                  <Icon className="iconfont icon-shichang"></Icon>
                  <Text className="main-text">读书时长</Text>
                  <View className="border right"></View>
                </View>
              </Navigator>
            </View>
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
