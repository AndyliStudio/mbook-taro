import { Block, View, Image, Input, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './reader-mulu.scss'
// pages/user/user.js
const config = require('../../config.js')
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    loading: true,
    nextLoading: true,
    hasMore: true,
    datas: [],
    keyword: '',
    searching: false,
    searchDatas: []
  }
  other = {
    bookid: '',
    page: 1,
    limit: 50,
    scrollTopValue: 0
  }

  componentWillMount(options = this.$router.params || {}) {
    if (!options.bookid) {
      Taro.showToast({ title: '页面参数错误', icon: 'none', duration: 2000 })
      Taro.navigateBack({ delta: 1 })
      return false
    }
    Taro.setNavigationBarTitle({ title: options.name || '章节目录' })
    this.other.bookid = options.bookid
    // 获取章节
    this.getMulu()
  }

  onReachBottom = () => {
    console.log('加载下一章')
    if (this.data.nextLoading || !this.data.hasMore || this.data.searching) {
      return false
    }
    this.getMulu(true)
  }
  getMulu = isNext => {
    if (isNext) {
      this.other.page += 1
    }
    this.setData({ nextLoading: true })
    Taro.request({
      url:
        config.base_url +
        '/api/chapter/list?bookid=' +
        this.other.bookid +
        '&pageid=' +
        this.other.page +
        '&limit=' +
        this.other.limit,
      header: { Authorization: 'Bearer ' + app.globalData.token },
      success: res => {
        this.setData({ nextLoading: false })
        if (res.data.ok) {
          if (this.data.loading) {
            this.setData({
              datas: this.data.datas.concat(res.data.list),
              loading: false,
              hasMore: this.other.page * this.other.limit < res.data.total
            })
          } else {
            this.setData({
              datas: this.data.datas.concat(res.data.list),
              hasMore: this.other.page * this.other.limit < res.data.total
            })
          }
        } else if (res.data.authfail) {
          // 防止多个接口失败重复打开重新登录页面
          if (
            utils
              .getCurrentPageUrlWithArgs()
              .indexOf('/loading/loading?need_login_again=1') < 0
          ) {
            Taro.navigateTo({
              url: '../loading/loading?need_login_again=1'
            })
          } else {
            if (isNext) this.other.page -= 1
          }
        } else {
          if (isNext) this.other.page -= 1
          Taro.showToast({
            title: '加载书籍章节失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        this.setData({ nextLoading: false })
        if (isNext) this.other.page -= 1
        Taro.showToast({
          title: '加载书籍章节失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  searchChapter = event => {
    // 禁止关键字为空的搜索
    if (!event.detail.value) {
      return false
    }
    let query = Taro.createSelectorQuery()
    query.selectViewport().scrollOffset()
    query.exec(res => {
      this.other.scrollTopValue = res[0].scrollTop
    })
    Taro.request({
      url:
        config.base_url +
        '/api/chapter/search?bookid=' +
        this.other.bookid +
        '&str=' +
        event.detail.value,
      success: res => {
        if (res.data.ok) {
          this.setData({ searchDatas: res.data.data, searching: true })
          Taro.pageScrollTo({ scrollTop: 0, duration: 0 })
        } else {
          Taro.showToast({
            title: '未找到相应章节',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: err => {
        Taro.showToast({
          title: '未找到相应章节',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  closeSearch = () => {
    Taro.navigateBack()
  }
  clearKeyword = () => {
    this.setData({
      keyword: '',
      searching: false
    })
    setTimeout(() => {
      Taro.pageScrollTo({ scrollTop: this.other.scrollTopValue, duration: 0 })
    }, 100)
  }
  gotoReader = event => {
    let pages = Taro.getCurrentPages() //当前页面
    let prevPage = pages[pages.length - 2] //上一页面
    prevPage.other.backFromMulu = true
    prevPage.other.backFromMuluId = event.currentTarget.dataset.id
    Taro.navigateBack({
      //返回
      delta: 1
    })
    // wx.navigateTo({ url: '../reader-new/reader-new?bookid=' + this.other.bookid + '&chapterid=' + event.currentTarget.dataset.id })
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '加载中...',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      loading,
      keyword,
      searching,
      datas,
      searchDatas,
      nextLoading,
      hasMore
    } = this.state
    return (
      <View className="chapter-mulu">
        {loading && (
          <View className="loading">
            <Image src="https://fs.andylistudio.com/mbook/book-loading.svg"></Image>
          </View>
        )}
        <View className="search-header">
          <View className="input-box">
            <Image
              className="icon"
              src="https://fs.andylistudio.com/1548171055699.png"
            ></Image>
            <Input
              name="input"
              className="keywrod"
              value={keyword}
              confirmType="search"
              onConfirm={this.searchChapter}
              placeholder="请输入章节名或者章节序号"
            ></Input>
            {keyword && (
              <Image
                className="del"
                onClick={this.clearKeyword}
                src="https://fs.andylistudio.com/1548171050359.png"
              ></Image>
            )}
          </View>
          <View className="right" onClick={this.clearKeyword}>
            取消
          </View>
        </View>
        {!searching && (
          <View className="content">
            {datas.map((item, index) => {
              return (
                <View
                  className="chapter-item"
                  key={item._id}
                  data-id={item._id}
                  onClick={this.gotoReader}
                >
                  <Text className="num">{'第' + item.num + '章'}</Text>
                  <Text className="name">{item.name}</Text>
                  {/*  <icon class="icon-lock" wx:if="{{item.lock}}"></icon>  */}
                </View>
              )
            })}
          </View>
        )}
        {searching && (
          <Block>
            {searchDatas.map((item, index) => {
              return (
                <View className="content search">
                  {searchDatas.length > 0 && (
                    <Block>
                      {searchDatas.map((item, index) => {
                        return (
                          <View
                            className="chapter-item"
                            key={item._id}
                            data-id={item._id}
                            data-num={item.num}
                            onClick={this.gotoReader}
                          >
                            <Text className="num">
                              {'第' + item.num + '章'}
                            </Text>
                            <Text className="name">{item.name}</Text>
                            {/*  <icon class="icon-lock" wx:if="{{item.lock}}"></icon>  */}
                          </View>
                        )
                      })}
                    </Block>
                  )}
                  {searchDatas.length === 0 && (
                    <View className="no-data">找不到此章节~</View>
                  )}
                </View>
              )
            })}
          </Block>
        )}
        {nextLoading && (
          <View className="chapter-loading">
            <Image src="https://fs.andylistudio.com/mbook/book-loading.svg"></Image>
            <Text>章节加载中，请稍后...</Text>
          </View>
        )}
        {!hasMore && (
          <View className="nomore">
            <Text className="des">没有更多章节了</Text>
          </View>
        )}
      </View>
    )
  }
}

export default _C
