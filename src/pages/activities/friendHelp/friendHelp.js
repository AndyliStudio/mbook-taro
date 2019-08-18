import {
  Block,
  View,
  Button,
  ScrollView,
  Image,
  Icon,
  Progress,
  Text
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../../component/fixed-btn/fixed-btn'
import LazyloadImg from '../../../component/lazyload-img/lazyload-img'
import NoData from '../../../component/nodata/nodata'
import Modal from '../../../component/modal/modal'
import Toast from '../../../component/toast/toast'
import './friendHelp.scss'
// pages/user/user.js
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
    loading: true,
    page: 1,
    limit: 10,
    total: 0,
    loadFail: false,
    lists: [],
    currentFhcode: '',
    shareParam: {},
    shareFhCode: {}
  }

  componentWillMount() {
    this.getFriendHelpBook()
  }

  onShareAppMessage = res => {
    // 关闭modal
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
    return this.data.shareParam
  }
  openShare = event => {
    let self = this
    // 获取当前书籍的助力ID
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/friend_help',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      data: {
        fhbid: event.target.dataset.fhbid,
        source: 'activity'
      },
      success: function(response) {
        if (response.data.ok) {
          const setting = app.globalData.globalSetting.friend_help_share
          let title = setting.title
          if (title.indexOf('{need_num}') > -1) {
            title = title.replace('{need_num}', response.data.need_num)
          }
          if (title.indexOf('{name}') > -1) {
            title = title.replace('{name}', response.data.name || '')
          }
          if (setting) {
            self.setData({
              shareFhCode: response.data.fhcode,
              shareParam: {
                title: title,
                path: setting.page + '?fhcode=' + response.data.fhcode,
                imageUrl: setting.imageUrl
              },
              modal: {
                show: true,
                name: 'secret',
                title: '温馨提示',
                inputValue: '',
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
            // 更新列表
            for (let i = 0; i < self.data.lists.length; i++) {
              if (
                self.data.lists[i]._id === event.target.dataset.fhbid &&
                typeof self.data.lists[i].left_num === 'undefined'
              ) {
                self.data.lists[i].left_num = response.data.need_num
                break
              }
            }
          } else {
            self.showToast('获取分享参数失败', 'bottom')
          }
        } else {
          self.showToast('获取分享参数失败', 'bottom')
        }
      },
      fail: function(err) {
        console.warn(err)
        self.showToast('获取分享参数失败', 'bottom')
        reject(false)
      }
    })
  }
  getFriendHelpBook = () => {
    let self = this
    self.setData({ loading: true, loadFail: false })
    Taro.request({
      method: 'GET',
      url:
        config.base_url +
        '/api/friend_help_book/list?page=' +
        self.data.page +
        '&limit=' +
        self.data.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({
            lists: res.data.list,
            total: res.data.total,
            loading: false,
            loadFail: false
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.setData({ loading: false, loadFail: true })
        }
      },
      fail: err => {
        self.setData({ loading: false, loadFail: true })
      }
    })
  }
  loadMoreData = () => {
    let self = this
    // 判断是否还有更多数据
    if (self.data.lists.length >= self.data.total) {
      return false
    }
    self.setData({ page: self.data.page + 1 })
    // 展示loading
    Taro.showLoading()
    Taro.request({
      method: 'GET',
      url:
        config.base_url +
        '/api/friend_help_book/list?page=' +
        self.data.page +
        '&limit=' +
        self.data.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        Taro.hideLoading()
        if (res.data.ok) {
          self.setData({ lists: self.data.lists.concat(res.data.list) })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast('获取助力书籍失败', 'bottom')
        }
      },
      fail: err => {
        Taro.hideLoading()
        self.showToast('获取助力书籍失败', 'bottom')
      }
    })
  }
  gotoRead = event => {
    Taro.navigateTo({
      url:
        '../../bookdetail/bookdetail?id=' + event.currentTarget.dataset.bookid
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
    navigationBarTitleText: '好友助力，免费阅读',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { modal, shareFhCode, loading, loadFail, lists } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <Modal
          className="fh-modal"
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
          <View className="des">已经为你生成分享口令</View>
          <View className="code">{shareFhCode}</View>
          <Button className="btn" openType="share">
            立即分享
          </Button>
        </Modal>
        <ScrollView
          className="friend-help"
          enableBackToTop="true"
          scrollY="true"
          onScrollToLower={this.loadMoreData}
        >
          <Image
            className="bg"
            src="https://fs.andylistudio.com/1537973910409.jpeg"
          ></Image>
          <View className="content">
            <View className="title">
              <View className="name">分享免费书籍</View>
              <View className="des">完成邀请任务即可解锁指定书籍</View>
            </View>
            <View className="books">
              {loading ? (
                <Block>
                  <Image
                    className="loading-img"
                    src="https://fs.andylistudio.com/mbook/book-loading.svg"
                  ></Image>
                  <View className="loading-text">正在加载数据</View>
                </Block>
              ) : (
                <Block>
                  {loadFail ? (
                    <Block>
                      <NoData
                        text="获取好友助力书籍数据失败"
                        subText="服务器开小差了，点击重新获取"
                        btnText="重新获取"
                        showBtn="true"
                        onBtnclick={this.getFriendHelpBook}
                      >
                        <Icon className="iconfont icon-zanwushuju"></Icon>
                      </NoData>
                    </Block>
                  ) : (
                    <Block>
                      {lists.length > 0 ? (
                        <Block>
                          {lists.map((item, index) => {
                            return (
                              <View className="book-item" key={item._id}>
                                <LazyloadImg
                                  className="img"
                                  src={item.bookid.img_url}
                                ></LazyloadImg>
                                <View className="left">
                                  <View className="name">
                                    {item.bookid.name}
                                  </View>
                                  <View className="author">
                                    {item.bookid.author}
                                  </View>
                                  {item.left_num >= 0 && (
                                    <View className="progress">
                                      <Progress
                                        percent={
                                          100 -
                                          (item.left_num * 100) / item.need_num
                                        }
                                      ></Progress>
                                      <Text className="pg-info">
                                        {item.left_num === 0
                                          ? '已完成'
                                          : item.need_num -
                                            item.left_num +
                                            '/' +
                                            item.need_num}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                {item.success ? (
                                  <Block>
                                    <Button
                                      className="right"
                                      data-bookid={item.bookid._id}
                                      onClick={this.gotoRead}
                                    >
                                      去阅读
                                    </Button>
                                  </Block>
                                ) : (
                                  <Block>
                                    <Button
                                      className="right"
                                      data-fhbid={item._id}
                                      onClick={this.openShare}
                                    >
                                      去分享
                                    </Button>
                                  </Block>
                                )}
                              </View>
                            )
                          })}
                        </Block>
                      ) : (
                        <Block>
                          <NoData
                            text="暂无助力书籍"
                            subText="服务器开小差了，点击重新获取"
                            btnText="重新获取"
                            showBtn="true"
                            onBtnclick={this.getFriendHelpBook}
                          >
                            <Icon className="iconfont icon-zanwushuju"></Icon>
                          </NoData>
                        </Block>
                      )}
                    </Block>
                  )}
                  {/*  暂无数据  */}
                </Block>
              )}
            </View>
          </View>
        </ScrollView>
      </Block>
    )
  }
}

export default _C
