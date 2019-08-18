import { Block, View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './fixed-btn.scss'
const app = Taro.getApp()
const utils = require('../../utils/util.js')

@withWeapp('Component')
class _C extends Taro.Component {
  state = {
    showFixedBtn: '', // 是否展示悬浮按钮
    imgUrl: '' // 图片地址
  }
  attached = () => {
    let showFixedBtn = false
    let imgUrl = ''
    const setting = app.globalData.dialogSetting
      ? app.globalData.dialogSetting['fixed-btn']
      : {}
    if (setting && setting.img_url) {
      if (setting.only_index) {
        if (utils.getCurrentPageUrlWithArgs().indexOf('/index/index') > -1) {
          showFixedBtn = true
        }
      } else {
        showFixedBtn = true
      }
      imgUrl = setting.img_url || ''
    }
    this.setData({
      showFixedBtn: showFixedBtn,
      imgUrl: imgUrl
    })
  }
  handleClick = event => {
    // wx.navigateTo({ url: '/pages/loading/loading?code=_94IVfPQ4_1539963531582' })
    const setting = app.globalData.dialogSetting['fixed-btn']
    if (!setting || !setting.img_url) {
      return false
    }
    // 自定义微信统计事件--click_fixed_button
    Taro.reportAnalytics('click_fixed_button', { time: +new Date() })
    if (setting.jump_type !== 'none') Taro.navigateTo({ url: setting.jump_url })
  }
  config = {
    component: true
  }

  render() {
    const { imgUrl, showFixedBtn } = this.state
    return (
      showFixedBtn && (
        <View className="fixed-btn" onClick={this.handleClick}>
          <Image src={imgUrl}></Image>
        </View>
      )
    )
  }
}

export default _C
