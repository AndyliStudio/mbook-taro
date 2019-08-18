import { Block, View, Form, Button, Image, Icon } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import NoData from '../../component/nodata/nodata'
import Toast from '../../component/toast/toast'
import './booklist.scss'
//booklist.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    spriteArr: [],
    myBooks: [],
    lock: false, // 区分点击事件和长按事件
    removing: false // 是否处于删除书籍的状态
  }

  componentDidShow() {
    this.getMyBookList()
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getMyBookList = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/booklist/mylist',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        if (res.data.ok) {
          self.setData({ myBooks: res.data.list })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast(
            '获取我的书单失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: err => {
        self.showToast('获取我的书单失败', 'bottom')
      }
    })
  }
  bookClick = event => {
    //检查锁
    if (this.data.lock) {
      return
    }
    if (this.data.removing) {
      this.setData({ removing: false })
      return
    }
    const formId = event.detail.formId
    const bookId = event.target.dataset.bookid
    app.reportFormId('read', formId, bookId)
    Taro.navigateTo({
      url: '../reader-new/reader-new?bookid=' + event.target.dataset.bookid
    })
  }
  bookLongClick = () => {
    let self = this
    //锁住
    self.setData({ lock: true, removing: true })
    setTimeout(function() {
      self.setData({ lock: false })
    }, 500)
  }
  removeBook = event => {
    let self = this
    let bookid = event.currentTarget.dataset.bookid
    Taro.request({
      url: config.base_url + '/api/booklist/remove_book?id=' + bookid,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: function(res) {
        if (res.data.ok) {
          self.setData({
            myBooks: self.data.myBooks.filter(item => {
              return item.bookid !== bookid
            })
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast(
            res.data.msg || '从书架中移除失败，请重新尝试~',
            'bottom'
          )
        }
      },
      fail: function(err) {
        self.showToast('从书架中移除失败，请重新尝试~', 'bottom')
      }
    })
  }

  componentDidHide() {
    //还原 removing状态
    this.setData({ removing: false })
  }

  gotoShop = () => {
    Taro.navigateTo({ url: '/pages/search/search' })
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
    navigationBarTitleText: '书城',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { toast, removing, myBooks } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <View className="container booklist">
          <View className="shelves">
            <View className="books">
              {myBooks.map((item, index) => {
                return (
                  <View
                    key="item.bookid"
                    hoverStartTime="2000"
                    className={'book-item ' + (removing ? 'shake' : '')}
                  >
                    <Form
                      className="image"
                      onSubmit={this.bookClick}
                      data-bookid={item.bookid}
                      onLongtap={this.bookLongClick}
                      reportSubmit="true"
                    >
                      <Button className="inner-btn" formType="submit">
                        <Image src={item.img_url}></Image>
                      </Button>
                    </Form>
                    {item.sign === 'update' && (
                      <View className="sign-update">更新</View>
                    )}
                    {item.sign === 'over' && (
                      <View className="sign-over">读完</View>
                    )}
                    {removing && (
                      <Icon
                        type="clear"
                        size="16"
                        color="#f76260"
                        data-bookid={item.bookid}
                        onClick={this.removeBook}
                      ></Icon>
                    )}
                  </View>
                )
              })}
              <View
                hoverStartTime="2000"
                className="book-item add"
                onClick={this.gotoShop}
              >
                <View className="image"></View>
                <Icon className="iconfont icon-add"></Icon>
              </View>
            </View>
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
