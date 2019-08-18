import { Block, View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import './readtime.scss'
// pages/user/user.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    minute: 0,
    num: 0
  }

  componentDidShow() {
    this.getInfo()
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getInfo = () => {
    Taro.request({
      url: config.base_url + '/api/read_time/my',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          this.setData({ minute: res.data.minute, num: res.data.num })
        } else {
          Taro.showToast({
            title: '获取阅读时长失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '获取阅读时长失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  getAward = () => {
    if (this.data.num > 0) {
      Taro.request({
        url: config.base_url + '/api/read_time/exchange',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success: res => {
          if (res.data.ok) {
            Taro.showToast({ title: '兑换成功', icon: 'success' })
            setTimeout(function() {
              Taro.hideLoading()
            }, 2000)
            this.setData({ minute: 0, num: 0 })
          } else if (res.data.authfail) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            Taro.showToast({
              title: '时长兑换书币失败',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: err => {
          Taro.showToast({
            title: '时长兑换书币失败',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      Taro.showToast({
        title: '当前阅读时长不足以兑换书币',
        icon: 'none',
        duration: 2000
      })
    }
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '阅读时长',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { minute, num } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="read-time">
          <View className="panel">
            <View className="main-text">
              {'累计阅读时长' + minute + '分钟'}
            </View>
            <View className="award-text">
              可兑换<Text className="num">{num}</Text>书币
            </View>
            <Button className="award-btn" onClick={this.getAward}>
              兑换
            </Button>
          </View>
          <View className="des">
            每30分钟的阅读时长可兑换5书币，阅读时长会在每周末自动清零，请及时兑换。
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
