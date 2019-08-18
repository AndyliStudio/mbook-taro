import { Block, View, Text, Picker, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './setting.scss'
// pages/setting/setting.js

const config = require('../../config.js')
const utils = require('../../utils/util.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userSetting: {
      updateNotice: true,
      autoBuy: true,
      reader: {
        fontSize: 28,
        fontFamily: '使用系统字体',
        mode: '默认',
        overPage: 0
      }
    },
    initMode: '默认',
    allFontFamily: [
      '使用系统字体',
      '微软雅黑',
      '黑体',
      'Arial',
      '楷体',
      '等线'
    ],
    allFontSize: [24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48],
    allStyleMode: ['默认', '淡黄', '护眼', '夜间'],
    allOverPage: [{ id: 0, name: '左右翻页' }, { id: 1, name: '上下翻页' }],
    previewBg: '#ffffff'
  }

  componentDidShow() {
    let self = this
    // 获取屏幕高度
    // self.setData({ 'userInfo': wx.getStorageSync('userinfo') })
    self.getUserSetting()
  }

  componentWillMount() {
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  bindPickerChange = event => {
    let self = this
    let pickerid = event.currentTarget.dataset.pickerid
    if (pickerid === 'fontSize') {
      self.setData({
        'userSetting.reader.fontSize':
          self.data.allFontSize[parseInt(event.detail.value)]
      })
    } else if (pickerid === 'fontFamily') {
      self.setData({
        'userSetting.reader.fontFamily':
          self.data.allFontFamily[event.detail.value]
      })
    } else if (pickerid === 'mode') {
      self.setData({
        'userSetting.reader.mode':
          self.data.allStyleMode[parseInt(event.detail.value)],
        previewBg: self.getBackGround(
          self.data.allStyleMode[event.detail.value]
        )
      })
    } else if (pickerid === 'overPage') {
      self.setData({
        'userSetting.reader.overPage':
          self.data.allOverPage[parseInt(event.detail.value)].id
      })
    }
  }
  switchChange = event => {
    let self = this
    self.setData({ 'userSetting.updateNotice': !!event.detail.value })
  }
  autoBuy = event => {
    let self = this
    self.setData({ 'userSetting.autoBuy': !!event.detail.value })
  }
  getBackGround = color => {
    if (color == '默认') {
      return '#f8f7fc'
    } else if (color == '淡黄') {
      return '#f6f0da'
    } else if (color == '护眼') {
      return '#c0edc6'
    } else if (color == '夜间') {
      return '#1d1c21'
    } else {
      return '#f8f7fc'
    }
  }
  getUserSetting = () => {
    let self = this
    // 判断本地缓存中是否存在设置缓存
    let localSetting = app.globalData.userInfo || {}
    if (localSetting && localSetting.setting) {
      let userSetting = utils.copyObject(
        self.data.userSetting,
        localSetting.setting
      )
      self.setData({
        userSetting: userSetting,
        previewBg: self.getBackGround(userSetting.reader.mode)
      })
    } else {
      Taro.request({
        url: config.base_url + '/api/user/get_user_setting',
        header: { Authorization: 'Bearer ' + app.globalData.token },
        success: res => {
          if (res.data.ok) {
            self.setData({
              userSetting: res.data.data,
              previewBg: self.getBackGround(res.data.data.reader.mode)
            })
            localSetting.setting = res.data.data
            Taro.setStorageSync('userinfo', localSetting)
          } else if (res.data.authfail) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            self.showToast('获取设置失败', 'bottom')
          }
        },
        fail: err => {
          self.showToast('获取设置失败', 'bottom')
        }
      })
    }
  }
  updateSetting = () => {
    let self = this
    // 更新全局用户设置
    app.globalData.userInfo.setting = self.data.userSetting
    Taro.request({
      url: config.base_url + '/api/user/put_user_setting',
      method: 'PUT',
      data: {
        setting: self.data.userSetting
      },
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          // self.setData({ userSetting: res.data.data, previewBg: self.getBackGround(res.data.data.reader.mode) })
          // localSetting.setting = res.data.data
          // wx.setStorageSync('userinfo', localSetting)
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('更新设置失败', 'bottom')
        }
      },
      fail: err => {
        self.showToast('更新设置失败', 'bottom')
      }
    })
  }

  componentWillUnmount() {
    let localSetting = app.globalData.userInfo || {}
    localSetting.setting = this.data.userSetting
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    Taro.setStorageSync('userinfo', localSetting)
    this.updateSetting()
  }

  componentDidHide() {
    let localSetting = app.globalData.userInfo || {}
    localSetting.setting = this.data.userSetting
    //onUnload方法在页面被关闭时触发，我们需要将用户的当前设置存下来
    Taro.setStorageSync('userinfo', localSetting)
    this.updateSetting()
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
    navigationBarTitleText: '设置',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      previewBg,
      userSetting,
      allFontSize,
      allFontFamily,
      allStyleMode,
      allOverPage
    } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="container setting">
          <View className="title">阅读器</View>
          <View
            className="preview"
            style={
              'background: ' +
              previewBg +
              '; font-size: ' +
              (userSetting.reader.fontSize + 'rpx') +
              '; font-family: ' +
              userSetting.reader.fontFamily +
              '; color: ' +
              (userSetting.reader.mode == '夜间' ? '#85898c' : '#000800')
            }
          >
            书山有路勤为径，学海无涯苦作舟
          </View>
          <View className="setting-item">
            <Text className="text">字体</Text>
            <Picker
              mode="selector"
              data-pickerid="fontSize"
              onChange={this.bindPickerChange}
              value={userSetting.reader.fontSize}
              range={allFontSize}
            >
              <View className="picker-view">{userSetting.reader.fontSize}</View>
            </Picker>
          </View>
          <View className="setting-item">
            <Text className="text">字体大小</Text>
            <Picker
              mode="selector"
              data-pickerid="fontFamily"
              onChange={this.bindPickerChange}
              value={userSetting.reader.fontFamily}
              range={allFontFamily}
            >
              <View className="picker-view">
                {userSetting.reader.fontFamily}
              </View>
            </Picker>
          </View>
          <View className="setting-item">
            <Text className="text">模式</Text>
            <Picker
              mode="selector"
              data-pickerid="mode"
              onChange={this.bindPickerChange}
              value={userSetting.reader.mode}
              range={allStyleMode}
            >
              <View className="picker-view">{userSetting.reader.mode}</View>
            </Picker>
          </View>
          <View className="setting-item">
            <Text className="text">翻页方式</Text>
            <Picker
              mode="selector"
              data-pickerid="overPage"
              onChange={this.bindPickerChange}
              value={userSetting.reader.overPage}
              range={allOverPage}
              rangeKey="name"
            >
              <View className="picker-view">
                {allOverPage[userSetting.reader.overPage].name}
              </View>
            </Picker>
          </View>
          <View className="title">更新</View>
          <View className="setting-item">
            <Text className="text">更新提醒</Text>
            <Switch
              checked={userSetting.updateNotice}
              onChange={this.switchChange}
            ></Switch>
          </View>
          <View className="title">支付</View>
          <View className="setting-item">
            <Text className="text">自动购买下一章</Text>
            <Switch
              checked={userSetting.autoBuy ? true : false}
              onChange={this.autoBuy}
            ></Switch>
          </View>
          <View className="title">其他</View>
          {/*  <navigator url="/pages/webpage/webpage?url=https://mbook.andylistudio.com/help" open-type="navigate">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         <view class="setting-item">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           <text class="text">帮助与反馈</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           <icon class="iconfont icon-arrow-right"></icon>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         </view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       </navigator>  */}
          {/*  <navigator url="/pages/webpage/webpage?url=https://mbook.andylistudio.com/notice" open-type="navigate">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             <view class="setting-item">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               <text class="text">关注公众号</text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               <icon class="iconfont icon-arrow-right"></icon>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             </view>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           </navigator>  */}
          {/*  <view class="setting-item">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 <button type="default">退出当前账号</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               </view>  */}
        </View>
      </Block>
    )
  }
}

export default _C
