import { Block, View, Image, WebView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './webpage.scss'
// pages/setting/webpage.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    url: ''
  }

  componentWillMount(options = this.$router.params || {}) {
    let self = this
    let url = options.url
    if (url) {
      if (options.url.indexOf('activity/share') > -1) {
        // 获取userid
        const userinfo = app.globalData.userInfo
        // 判断 url是否已经携带参数
        if (url.indexOf('?') > -1) {
          url += '&uid=' + userinfo._id
        } else {
          url += '?uid=' + userinfo._id
        }
        self.setData({ url: url })
      } else {
        self.setData({ url: url })
      }
    } else {
      self.showToast('地址为空', 'bottom')
    }
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  reciveMessage = event => {}
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
    navigationBarTitleText: '',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { url } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="loading">
          <Image
            src="//fs.andylistudio.com/mbook/v3/images/book-loading.svg"
            alt="页面加载中..."
          ></Image>
        </View>
        <WebView src={url} onMessage={this.reciveMessage}></WebView>
      </Block>
    )
  }
}

export default _C
