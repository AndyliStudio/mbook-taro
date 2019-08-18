import { Block, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import LazyloadImg from '../../component/lazyload-img/lazyload-img'
import NoData from '../../component/nodata/nodata'
import Toast from '../../component/toast/toast'
// pages/user/user.js
const config = require('../../config.js')

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: {
      show: false,
      content: '',
      position: 'bottom' // 提示信息
    }
  }

  componentWillMount() {
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
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '首页',
    navigationBarTextStyle: 'white'
  }

  render() {
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View>书店</View>
      </Block>
    )
  }
}

export default _C
