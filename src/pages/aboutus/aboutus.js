import { Block, View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import './aboutus.scss'
// pages/user/user.js
const config = require('../../config.js')

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    onLoad: function() {
      // 当前页面不予许分享
      Taro.hideShareMenu()
    }
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '关于我们',
    navigationBarTextStyle: 'white'
  }

  render() {
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="aboutus">
          <View className="header">
            <Image
              className="logo"
              src="https://fs.andylistudio.com/1544350770984.jpeg"
            ></Image>
            <View className="name">美景阅读</View>
          </View>
          <View className="infos">
            <View className="infos-item">
              <Text className="left">官方微信</Text>
              <Text className="right">bcydushu</Text>
            </View>
            {/*  <view class="infos-item">
                                                                                                                                                                                                                                                                                                                                                                    <text class="left">官方微博</text>
                                                                                                                                                                                                                                                                                                                                                                    <text class="right">带你去月光倾城的地方</text>
                                                                                                                                                                                                                                                                                                                                                                  </view>  */}
            {/*  <view class="infos-item">
                                                                                                                                                                                                                                                                                                                                                                                     <text class="left">官方网站</text>
                                                                                                                                                                                                                                                                                                                                                                                     <text class="right">www.andylistudio.com</text>
                                                                                                                                                                                                                                                                                                                                                                                   </view>  */}
            <View className="infos-item">
              <Text className="left">客服电话</Text>
              <Text className="right">17379459575</Text>
            </View>
            <View className="infos-item">
              <Text className="left">邮箱</Text>
              <Text className="right">wangjitonghua@163.com</Text>
            </View>
          </View>
          <View className="footer">
            <View>美景阅读 版权所有</View>
            <View>p Copyright 2018-2019 美景阅读. All Rights Reserved.</View>
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
