import {
  Block,
  View,
  Button,
  Input,
  Text,
  Image,
  Form,
  Icon
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Modal from '../../component/modal/modal'
import NoData from '../../component/nodata/nodata'
import './bookdetail.scss'
//bookdetail.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
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
    detail: {},
    isInList: false,
    showAllDes: false,
    goodInfo: '',
    comments: [],
    commentInputHide: true,
    commentType: null, // 评论类型，是回复别人还是评论书籍
    currentCommentValue: '',
    secretTips: '',
    hasUnLock: false, // 用户是否已经解锁过改章节
    shutChargeTips: false, // 是否屏蔽充值提示
    showIndexBtn: '', // 是否展示返回首页按钮
    isShowRss: true,
    hasRssTheBook: false,
    isInShareWhiteList: false // 当前用户是否处于分享白名单里
  }
  other = {
    bookid: '',
    wxcode: '',
    auto_secret: false, // 是否自动解锁书籍
    auto_secret_code: '',
    auto_unlock_code: ''
  }

  componentDidShow() {
    let hasRssBookArr = Taro.getStorageSync('hasRssBookArr') || []
    if (hasRssBookArr.indexOf(this.other.bookid) > -1) {
      this.setData({
        hasRssTheBook: true
      })
    }
  }

  componentWillMount(options = this.$router.params || {}) {
    // 隐藏分享按钮
    Taro.hideShareMenu()
    let secretTips =
      app.globalData.globalSetting && app.globalData.globalSetting.secret_tips
        ? app.globalData.globalSetting.secret_tips
        : '请联系客服，在支付2-3元后，客服人员会发送给你一串阅读秘钥用来解锁整本书。'
    Taro.showNavigationBarLoading()
    this.getBookDetail(options.id)
    this.getCommentList(options.id)
    let isShowRss = true
    let noRssShowArr = Taro.getStorageSync('noRssShowArr') || []
    if (noRssShowArr.indexOf(options.id) > -1) {
      isShowRss = false
    }
    console.log('是否为分享白名单', app.globalData.shareWhiteList)
    this.setData({
      showIndexBtn: options.indexbtn === '1',
      secretTips: secretTips,
      shutChargeTips: app.globalData.globalSetting.shut_charge_tips || false,
      isShowRss: isShowRss,
      isInShareWhiteList: app.globalData.shareWhiteList
    })
    this.other.auto_unlock_code = options.auto_secret
    this.other.bookid = options.id
    this.other.wxcode = app.globalData.globalSetting.wxcode || 'haitianyise_hl'
  }

  onShareAppMessage = res => {
    // 是否是分享白名单里的用户
    const auto_secret = app.globalData.shareWhiteList
    // 获取分享出去的图片地址
    return {
      title: '我正在阅读《' + this.data.detail.name + '》，进来看看吧~',
      path:
        '/pages/loading/loading?bookid=' +
        this.other.bookid +
        (auto_secret && this.other.auto_secret_code
          ? '&auto_secret=' + this.other.auto_secret_code
          : '')
    }
  }
  getBookDetail = id => {
    if (!id) {
      Taro.showToast({
        title: '获取书籍信息失败~',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    Taro.request({
      url: config.base_url + '/api/book/get_detail?id=' + id,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          // devide des into shortDes and des;
          let shortDes = ''
          // format des
          let des = res.data.data.des.replace(/[\n\r\s]+/, '')
          res.data.data.des = des.replace(/( ){2,}/, ' ')
          if (des.length > 95) {
            shortDes = des.substring(0, 70) + '...'
          }
          res.data.data.shortDes = shortDes
          let goodInfo = ''
          if (res.data.data.good.type === 'free') {
            goodInfo = '全书免费'
          } else if (res.data.data.good.type === 'normal') {
            goodInfo = '每章需要 ' + res.data.data.good.prise + ' 书币'
          } else if (res.data.data.good.type === 'limit_chapter') {
            goodInfo =
              '前' +
              res.data.data.good['limit_chapter'] +
              '免费，后续章节每章 ' +
              res.data.data.good.prise +
              ' 书币'
          } else if (res.data.data.good.type === 'limit_date') {
            goodInfo =
              res.data.data.good['limit_start_date'] +
              ' 至 ' +
              res.data.data.good['limit_end_date'] +
              '免费，后续章节每章 ' +
              res.data.data.good.prise +
              ' 书币'
          } else {
            goodInfo = '全书免费'
          }
          // 如果当前书籍没在书架中，自动加入书架
          this.setData({
            detail: res.data.data,
            isInList: res.data.isInList,
            goodInfo: goodInfo,
            hasUnLock: res.data.data.hasUnLock,
            hasRssTheBook: !!res.data.data.rss
          })
          if (!res.data.isInList) {
            this.addOrRemove()
          }
          // 如果页面带有auto_secret参数，则帮当前用户自动解锁书籍
          if (!res.data.data.hasUnLock && this.other.auto_unlock_code) {
            this.autoUnLockBook()
          }
          Taro.setNavigationBarTitle({
            title: res.data.data.name
          })
          Taro.hideNavigationBarLoading()
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: '获取书籍信息失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '获取书籍信息失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  getCommentList = id => {
    if (!id) {
      return false
    }
    Taro.request({
      url: config.base_url + '/api/comment/list?bookid=' + id,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          res.data.list = res.data.list.map(item => {
            item.isOpenMoreComment = false
            return item
          })
          this.setData({
            comments: res.data.list
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '获取评论失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '获取评论失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  showAllDes = () => {
    if (this.data.detail.shortDes) {
      if (this.data.showAllDes) {
        this.setData({
          showAllDes: false
        })
      } else {
        this.setData({
          showAllDes: true
        })
      }
    }
  }
  openSecret = () => {
    this.setData({
      modal: {
        show: true,
        name: 'input',
        title: '请输入您的粉丝凭证',
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
  }
  openContact = () => {
    this.setData({
      'modal.name': 'contact'
    })
  }
  hasSecret = () => {
    this.setData({
      'modal.title': '请输入您的粉丝凭证',
      'modal.name': 'input'
    })
  }
  bindKeyInput = e => {
    this.setData({
      'modal.inputValue': e.detail.value
    })
  }
  finishSecretInput = () => {
    if (!this.data.modal.inputValue) {
      Taro.showToast({
        title: '请输入粉丝凭证',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    Taro.request({
      url:
        config.base_url +
        '/api/secret/open?bookid=' +
        this.other.bookid +
        '&secret=' +
        this.data.modal.inputValue,
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          // 隐藏购买提示
          this.setData({
            'modal.show': false,
            hasUnLock: true
          })
          Taro.showToast({
            title: '开始阅读吧~',
            icon: 'success'
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '请重试' + (res.data.msg ? '，' + res.data.msg : ''),
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  copyWxcode = () => {
    Taro.setClipboardData({
      data: this.data.wxcode,
      success: res => {
        Taro.showToast({
          title: '复制成功',
          icon: 'success'
        })
        this.setData({
          'modal.show': false
        })
        setTimeout(function() {
          Taro.hideToast()
        }, 2000)
      }
    })
  }
  addOrRemove = () => {
    if (this.data.isInList) {
      Taro.request({
        url:
          config.base_url + '/api/booklist/remove_book?id=' + this.other.bookid,
        header: {
          Authorization: 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.data.ok) {
            this.setData({
              isInList: false
            })
          } else if (res.data.authfail) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            Taro.showToast({
              title: res.data.msg || '从书架中移除失败，请重新尝试~',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function(err) {
          Taro.showToast({
            title: '从书架中移除失败，请重新尝试~',
            icon: 'none',
            duration: 2000
          })
        }
      })
    } else {
      Taro.request({
        url: config.base_url + '/api/booklist/add_book?id=' + this.other.bookid,
        header: {
          Authorization: 'Bearer ' + app.globalData.token
        },
        success: res => {
          if (res.data.ok) {
            // wx.showToast({ title: '加入书架成功', icon: 'success' })
            this.setData({
              isInList: true
            })
          } else if (res.data.authfail) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            Taro.showToast({
              title: res.data.msg || '加入书架失败，请重新尝试~',
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: function(err) {
          Taro.showToast({
            title: '加入书架失败，请重新尝试~',
            icon: 'none',
            duration: 2000
          })
        }
      })
    }
  }
  addLikeNum = event => {
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    Taro.request({
      url:
        config.base_url +
        '/api/comment/like?commentid=' +
        commentid +
        '&op=' +
        (this.data.comments[index].is_like ? 'remove' : 'add'),
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      success: res => {
        if (res.data.ok) {
          let key1 = 'comments[' + index + '].like_num'
          let key2 = 'comments[' + index + '].is_like'
          this.setData({
            [key1]: res.data.current,
            [key2]: this.data.comments[index].is_like ? false : true
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '点赞失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '点赞失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  readMoreComments = event => {
    let commentid = event.currentTarget.dataset.commentid
    let index = event.currentTarget.dataset.index
    let key = 'comments[' + index + '].isOpenMoreComment'
    this.setData({
      [key]: !this.data.comments[index].isOpenMoreComment
    })
  }
  toWriteComment = event => {
    if (event.currentTarget.id == 'write') {
      this.setData({
        commentInputHide: false,
        commentType: null
      })
    } else {
      const commentid = event.currentTarget.dataset.commentid
      const username = event.currentTarget.dataset.username
      const storeUsername = app.globalData.userInfo.username
      if (storeUsername === username) {
        Taro.showToast({
          title: '自己不能回复自己',
          icon: 'none',
          duration: 2000
        })
      } else {
        this.setData({
          commentInputHide: false,
          commentType: {
            id: commentid,
            username: username
          }
        })
      }
    }
    app.reportFormId('comment', event.detail.formId, this.other.bookid)
  }
  hideCommentBar = () => {
    this.setData({
      commentInputHide: true
    })
  }
  stageCommentValue = e => {
    this.setData({
      currentCommentValue: e.detail.value
    })
  }
  saveFormId = event => {}
  sendComment = event => {
    let content = event.detail.value
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/comment/add',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid,
        content: content,
        father: this.data.commentType ? this.data.commentType.id : ''
      },
      success: res => {
        if (res.data.ok) {
          Taro.showToast({
            title: '发布书评成功',
            icon: 'success'
          })
          let comments = this.data.comments
          comments.unshift(res.data.data)
          // 清空当前评论内容，重新加载comment
          this.setData({
            currentCommentValue: ''
          })
          this.getCommentList(this.other.bookid)
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '发布书评失败~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '发布书评失败~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  goToReader = event => {
    const formId = event.detail.formId
    app.reportFormId('read', formId, this.other.bookid)
    Taro.navigateTo({
      url: '../reader-new/reader-new?bookid=' + this.other.bookid
    })
  }
  gotoIndex = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }
  rssThisBook = event => {
    let rss = parseInt(event.target.dataset.rrs)
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/booklist/rss',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid,
        rss: rss ? 1 : 0
      },
      success: res => {
        if (res.data.ok) {
          this.setData({
            hasRssTheBook: !!rss
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '订阅书籍失败，请重试',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function(err) {
        Taro.showToast({
          title: '订阅书籍失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  openShareModal = () => {
    this.setData({
      modal: {
        show: true,
        name: 'share',
        title: '选择分享类型',
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
  }
  autoUnLockShare = () => {
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/secret/pre_create',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        bookid: this.other.bookid
      },
      success: res => {
        if (res.data.ok) {
          this.setData({
            modal: {
              show: true,
              name: 'auto_unlock',
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
          this.other.auto_secret_code = res.data.data
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          Taro.showToast({
            title: res.data.msg || '好像不对哦~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function(err) {
        Taro.showToast({
          title: '好像不对哦~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  autoUnLockBook = () => {
    Taro.request({
      method: 'POST',
      url: config.base_url + '/api/secret/pre_secret_open',
      header: {
        Authorization: 'Bearer ' + app.globalData.token
      },
      data: {
        pre_secret: this.other.auto_unlock_code
      },
      success: res => {
        if (res.data.ok) {
          Taro.showToast({
            title: '开始阅读吧~',
            icon: 'success'
          })
          this.setData({
            hasUnLock: true
          })
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else if (res.data.repeat) {
          return
        } else {
          Taro.showToast({
            title: res.data.msg || '好像不对哦~',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: function(err) {
        Taro.showToast({
          title: '好像不对哦~',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  closeModal = () => {
    this.setData({
      'modal.show': false
    })
  }
  rssNoShow = () => {
    let noRssShowArr = Taro.getStorageSync('noRssShowArr') || []
    this.setData({
      isShowRss: false
    })
    if (noRssShowArr.indexOf(this.other.bookid) < 0) {
      noRssShowArr.push(this.data.other)
      Taro.setStorageSync('noRssShowArr', noRssShowArr)
    }
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      modal,
      secretTips,
      shutChargeTips,
      wxcode,
      detail,
      goodInfo,
      hasUnLock,
      showIndexBtn,
      isInShareWhiteList,
      showAllDes,
      hasRssTheBook,
      isShowRss,
      commentInputHide,
      comments,
      currentCommentValue,
      commentType
    } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <Modal
          className="detail-modal"
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
          {modal.name === 'secret' && (
            <View>
              <View className="des">{secretTips}</View>
              {!shutChargeTips && (
                <Button className="btn" onClick={this.openContact}>
                  联系客服
                </Button>
              )}
              <Button className="btn" onClick={this.hasSecret}>
                我已有资格
              </Button>
            </View>
          )}
          {modal.name === 'input' && (
            <View>
              <Input
                className="secret-input"
                type="text"
                onInput={this.bindKeyInput}
                placeholder="请输入粉丝凭证"
              ></Input>
              <Button className="btn" onClick={this.finishSecretInput}>
                确认
              </Button>
            </View>
          )}
          {modal.name === 'contact' && (
            <View>
              <View className="des">
                请添加微信号<Text className="bold">{wxcode}</Text>为好友。
              </View>
              <Button className="btn" onClick={this.copyWxcode}>
                复制客服微信
              </Button>
            </View>
          )}
          {modal.name === 'share' && (
            <View>
              <Button
                className="btn"
                openType="share"
                onClick={this.closeModal}
              >
                普通分享
              </Button>
              <Button className="btn" onClick={this.autoUnLockShare}>
                自动解锁分享
              </Button>
            </View>
          )}
          {modal.name === 'auto_unlock' && (
            <View>
              <View className="des">
                已为您创建自动解锁分享秘钥，请点击下方按钮分享给用户
              </View>
              <Button
                className="btn"
                openType="share"
                onClick={this.closeModal}
              >
                立即分享
              </Button>
            </View>
          )}
        </Modal>
        <View className="container detail">
          <View className="head">
            <View className="headBackgroundContainer">
              <View
                className="headBackground"
                style={
                  "background:url('" +
                  detail.img_url +
                  "') no-repeat center;background-size:200%;"
                }
              ></View>
            </View>
            <View className="bookInfo">
              <Image
                className="headImg"
                src={detail.img_url}
                mode="scaleToFill"
              ></Image>
              <View className="left-text">
                <View className="bookName">{detail.name}</View>
                <View className="author">{'作者：' + detail.author}</View>
                <View className="wordsNum">
                  {'字数：' + detail.total_words}
                </View>
                <View className="status">
                  {'状态：' + detail.update_status}
                </View>
                <View className="updatetime">
                  {'更新时间：' + detail.update_time}
                </View>
                {/*  <view wx:if="{{!shutChargeTips}}" class="prise">价格：{{goodInfo}}</view>  */}
              </View>
            </View>
            <View className="clearfix"></View>
            <View className="btn-group">
              <Form
                className="read"
                onSubmit={this.goToReader}
                reportSubmit="true"
              >
                <Button className="inner-btn" formType="submit">
                  <Text className="iconfont icon-yuedu"></Text>
                  <Text>立即阅读</Text>
                </Button>
              </Form>
              {/*  解锁按钮  */}
              {!shutChargeTips && !showIndexBtn && (
                <Block>
                  {goodInfo !== '全书免费' && !hasUnLock && (
                    <View className="addToList" onClick={this.openSecret}>
                      <View className="inner-btn">
                        <Text className="iconfont icon-xihuan"></Text>
                        <Text>我是粉丝</Text>
                      </View>
                    </View>
                  )}
                  {goodInfo !== '全书免费' && hasUnLock && (
                    <View className="addToList">
                      <View className="iconfont icon-rightline"></View>
                      <Text>粉丝你好</Text>
                    </View>
                  )}
                </Block>
              )}
              {/*  返回首页按钮  */}
              {showIndexBtn && (
                <Block>
                  <View className="addToList" onClick={this.gotoIndex}>
                    <View className="iconfont icon-shouye"></View>
                    <Text>返回首页</Text>
                  </View>
                </Block>
              )}
            </View>
            {isInShareWhiteList ? (
              <Button className="share-btn" onClick={this.openShareModal}>
                <Text className="iconfont icon-fenxiang"></Text>分享书籍
              </Button>
            ) : (
              <Button className="share-btn" openType="share">
                <Text className="iconfont icon-fenxiang"></Text>分享书籍
              </Button>
            )}
          </View>
          <View className="book-des">
            <View className="des-content" onClick={this.showAllDes}>
              {showAllDes || !detail.shortDes ? detail.des : detail.shortDes}
              <Text
                className="read-more"
                hidden={showAllDes || !detail.shortDes}
              >
                阅读全部 >
              </Text>
            </View>
          </View>
          {isShowRss && (
            <View className="rss">
              {hasRssTheBook && (
                <Block>
                  <View className="rss-des">
                    你已经订阅本书籍，书籍有章节更新时，我们会及时通知你。你也可以点击下方按钮来取消订阅。
                  </View>
                  <View className="buttons">
                    <Button
                      className="rss-btn cancel"
                      data-rrs="0"
                      onClick={this.rssThisBook}
                    >
                      取消订阅
                    </Button>
                  </View>
                </Block>
              )}
              {!hasRssTheBook && (
                <Block>
                  <View className="rss-des">
                    喜欢这本书的话，可以点击下方的订阅按钮来获取书籍的实时更新消息。
                  </View>
                  <View className="buttons">
                    <Button
                      className="rss-btn"
                      data-rrs="1"
                      onClick={this.rssThisBook}
                    >
                      订阅此书籍
                    </Button>
                    <Button className="rss-btn cancel" onClick={this.rssNoShow}>
                      不再显示
                    </Button>
                  </View>
                </Block>
              )}
            </View>
          )}
          <View className="splitor"></View>
          <View className={'comments ' + (commentInputHide ? '' : 'bottom')}>
            <Form
              className="title"
              onSubmit={this.toWriteComment}
              reportSubmit={true}
            >
              精彩评论
              <Button className="add-comment" id="write" formType="submit">
                写评论
              </Button>
            </Form>
            {comments.map((item, index) => {
              return (
                <View className="comment-list">
                  {comments.length > 0 && (
                    <Block>
                      {comments.map((item, index) => {
                        return (
                          <View
                            className="comment-item"
                            data-commentid={item.id}
                            key={item.id}
                          >
                            <Image
                              className="headImg"
                              src={item.avatar}
                              mode="scaleToFill"
                            ></Image>
                            <View className="comment-right">
                              <View
                                className="reader-name"
                                data-userid={item.userid}
                              >
                                {item.username}
                              </View>
                              <View className="create-time">
                                {item.create_time}
                              </View>
                              <View className="comment">{item.content}</View>
                              {item.childs.length > 0 && (
                                <View
                                  className="comment-more"
                                  onClick={this.readMoreComments}
                                  data-commentid={item.id}
                                  data-index={index}
                                >
                                  {item.isOpenMoreComment
                                    ? '收起回复'
                                    : '查看' + item.childs.length + '条回复 >'}
                                </View>
                              )}
                              {item.childs.length > 0 &&
                                item.isOpenMoreComment && (
                                  <View className="childComments">
                                    {item.childs.map((childItem, index) => {
                                      return (
                                        <View
                                          className="child-item"
                                          key={childItem.id}
                                          data-commentid={childItem.id}
                                          data-username={childItem.username}
                                          onClick={this.toWriteComment}
                                        >
                                          {childItem.username +
                                            ' 回复 ' +
                                            childItem.reply.username +
                                            ' ：' +
                                            childItem.content}
                                          <Text className="childItem-time">
                                            {childItem.create_time}
                                          </Text>
                                        </View>
                                      )
                                    })}
                                  </View>
                                )}
                              <View className="toolbar">
                                <Icon
                                  className={
                                    'iconfont icon-zan1 ' +
                                    (item.is_like ? ' selected' : '')
                                  }
                                  onClick={this.addLikeNum}
                                  data-commentid={item.id}
                                  data-index={index}
                                ></Icon>
                                <Text
                                  className={
                                    'likeNum  ' +
                                    (item.is_like ? ' selected' : '')
                                  }
                                >
                                  {item.like_num || 0}
                                </Text>
                                <Icon
                                  className="iconfont icon-comment"
                                  data-commentid={item.id}
                                  data-username={item.username}
                                  onClick={this.toWriteComment}
                                ></Icon>
                              </View>
                            </View>
                          </View>
                        )
                      })}
                    </Block>
                  )}
                  {comments.length == 0 && (
                    <View className="no-comments">
                      <NoData
                        text="暂无评论，快去抢沙发..."
                        subText
                        btnText="发表评论"
                        showBtn="true"
                        onBtnclick={this.toWriteComment}
                      >
                        <Icon className="iconfont icon-zanwupinglun"></Icon>
                      </NoData>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
          <View className="commnet-input-bar" hidden={commentInputHide}>
            <Input
              className="comment-input"
              value={currentCommentValue}
              placeholder={
                commentType.id ? '回复' + commentType.username : '写评论'
              }
              placeholderClass="commentInputP"
              focus={!commentInputHide}
              maxlength="100"
              onBlur={this.hideCommentBar}
              onConfirm={this.sendComment}
              confirmType="send"
            ></Input>
            <View className="cancle" onClick={this.hideCommentBar}>
              取消
            </View>
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
