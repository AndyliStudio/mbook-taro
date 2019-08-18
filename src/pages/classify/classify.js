import {
  Block,
  View,
  Text,
  ScrollView,
  Navigator,
  Icon,
  Image
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import NoData from '../../component/nodata/nodata'
import './classify.scss'
// classify.js
const config = require('../../config.js')

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    classifyTypes: [
      '全部书籍',
      '玄幻·奇幻',
      '修真·仙侠',
      '都市·青春',
      '历史·军事',
      '网游·竞技',
      '科幻·灵异',
      '言情·穿越',
      '耽美·同人',
      '侦探·推理'
    ],
    page: 1,
    total: 0,
    classifyData: [],
    currentIndex: 0,
    scrollTop: { scrollTop_value: 0, backTop_show: false },
    hasSrollBottom: false
  }

  componentWillMount(options = this.$router.params || {}) {
    var self = this
    //根据url中传过来的分类index，加载指定的分类数据，index默认值1
    if (options.index) {
      self.setData({ currentIndex: options.index })
      self.getClassifyData(options.index, self.data.page)
    } else {
      self.getClassifyData(self.data.currentIndex, self.data.page)
    }
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getClassifyData = (index, page, isLoadMore) => {
    //显示加载中
    Taro.showToast({ title: '加载中', icon: 'loading' })
    let self = this
    if (!isLoadMore) {
      page = 1
      self.setData({ page: 1 })
    }
    Taro.request({
      url:
        config.base_url + '/api/book/classify?index=' + index + '&page=' + page,
      header: { 'content-type': 'application/json' },
      success: function(res) {
        //隐藏加载信息
        setTimeout(function() {
          Taro.hideToast()
        }, 300)
        if (res.data.ok) {
          if (isLoadMore) {
            self.setData({
              classifyData: self.data.classifyData.concat(res.data.list),
              total: res.data.total
            })
          } else {
            self.setData({ classifyData: res.data.list, total: res.data.total })
          }
        } else {
          self.showToast(
            '获取书籍分类失败' + res.data.msg ? '，' + res.data.msg : '',
            'bottom'
          )
        }
      },
      error: function(err) {
        setTimeout(function() {
          Taro.hideToast()

          self.showToast('获取分类数据失败~', 'bottom')
        }, 500)
      }
    })
  }
  showClassify = event => {
    this.setData({ currentIndex: event.currentTarget.dataset.index })
    this.getClassifyData(this.data.currentIndex, this.data.page)
  }
  loadMoreData = event => {
    let page = this.data.page + 1
    if (page >= Math.ceil(this.data.total / 8) + 1) {
      if (!this.data.hasScrollBottom) {
        Taro.showToast({ title: '暂无更多数据~' })
        this.setData({ hasScrollBottom: true })
      }
    } else {
      this.setData({ page: page })
      this.getClassifyData(this.data.currentIndex, this.data.page, true)
    }
  }
  backToTop = () => {
    var topValue = this.data.scrollTop.scrollTop_value //发现设置scroll-top值不能和上一次的值一样，否则无效，所以这里加了个判断
    if (topValue == 1) {
      topValue = 0
    } else {
      topValue = 1
    }
    this.setData({
      'scrollTop.scrollTop_value': topValue
    })
  }
  reloadData = () => {
    this.getClassifyData(this.data.currentIndex, this.data.page)
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '分类',
    navigationBarTextStyle: 'white'
  }

  render() {
    const { currentIndex, classifyTypes, classifyData, scrollTop } = this.state
    return (
      <Block>
        <FixedBtn></FixedBtn>
        <View className="classify-container">
          <View className="tab">
            {classifyTypes.map((tabItem, tabIndex) => {
              return (
                <View
                  className={
                    'tab-item ' + (currentIndex == tabIndex ? 'active' : '')
                  }
                  key="engName"
                  data-index={tabIndex}
                  onClick={this.showClassify}
                >
                  <Text>{tabItem}</Text>
                  {currentIndex == tabIndex && (
                    <View className="tabLine"></View>
                  )}
                </View>
              )
            })}
          </View>
          {classifyData.map((item, index) => {
            return (
              <ScrollView
                className="tab-content"
                enableBackToTop="true"
                scrollY="true"
                onScrollToLower={this.loadMoreData}
                style={
                  'padding-top: ' +
                  (classifyData.length == 0 ? '60rpx' : '30rpx')
                }
              >
                {(classifyData.length == 0 ? true : false) && (
                  <NoData
                    text="暂无数据"
                    btnText="重新获取"
                    showBtn="true"
                    onBtnclick={this.reloadData}
                  ></NoData>
                )}
                {classifyData.length > 0 && (
                  <Block>
                    {classifyData.map((bookItem, bookIndex) => {
                      return (
                        <Navigator
                          url={
                            '/pages/bookdetail/bookdetail?id=' +
                            bookItem._id +
                            '&name=' +
                            bookItem.name
                          }
                          key="_id"
                        >
                          <View
                            className="book-item"
                            data-bookid={bookItem._id}
                          >
                            <View className="bookInfo">
                              <Text className="bookName">
                                <Text className="des">书名:</Text>
                                {bookItem.name + '\\n'}
                              </Text>
                              <Text className="author">
                                <Text className="des">作者:</Text>
                                {bookItem.author + '\\n'}
                              </Text>
                              <Text className="bookDes">
                                <Text className="des">描述:</Text>
                                {bookItem.des}
                              </Text>
                              <Icon
                                hidden={bookIndex == 0}
                                className="first-icon"
                              ></Icon>
                            </View>
                            <Image
                              src={bookItem.img_url}
                              mode="scaleToFill"
                            ></Image>
                          </View>
                        </Navigator>
                      )
                    })}
                  </Block>
                )}
              </ScrollView>
            )
          })}
          <View
            className="backTop"
            onClick={this.backToTop}
            hidden={!scrollTop.backTop_show}
          >
            <Icon className="backTop-icon"></Icon>
          </View>
        </View>
      </Block>
    )
  }
}

export default _C
