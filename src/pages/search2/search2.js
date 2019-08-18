import {
  Block,
  ScrollView,
  View,
  Image,
  Input,
  Text,
  Navigator,
  Icon
} from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import LazyloadImg from '../../component/lazyload-img/lazyload-img'
import NoData from '../../component/nodata/nodata'
import Toast from '../../component/toast/toast'
import './search2.scss'
const config = require('../../config.js')

var app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    keywrod: '',
    searchStatus: false,
    goodsList: [],
    helpKeyword: [],
    historyKeyword: [],
    categoryFilter: false,
    currentSortType: 'default',
    currentSortOrder: '',
    filterCategory: [],
    defaultKeyword: '',
    hotKeyword: [],
    page: 1,
    size: 20,
    currentSortType: 'id',
    currentSortOrder: 'desc',
    categoryId: 0
  }
  closeSearch = () => {
    Taro.reLaunch({ url: '../search2/search2' })
  }
  clearKeyword = () => {
    this.setData({
      keyword: '',
      searchStatus: false
    })
  }

  componentWillMount() {
    this.getSearchKeyword()
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getSearchKeyword = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/book/search_hot',
      method: 'GET',
      success: res => {
        self.setData({
          historyKeyword: Taro.getStorageSync('history_keyword'),
          defaultKeyword: res.data.default || '请输入搜索关键字',
          hotKeyword: ['家', '春', '秋']
        })
      }
    })
  }
  inputChange = e => {
    this.setData({
      keyword: e.detail.value,
      searchStatus: false
    })
    this.getHelpKeyword()
  }
  getHelpKeyword = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/book/search_help',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      method: 'POST',
      data: {
        keyword: self.data.keyword.trim()
      },
      success: res => {
        if (res.data.ok) {
          self.setData({
            helpKeyword: res.data.list.filter(item => {
              return item === '家' || item === '春' || item === '秋'
            })
          })
        }
      }
    })
  }
  inputFocus = () => {
    this.setData({
      searchStatus: false,
      goodsList: []
    })

    if (this.data.keyword) {
      this.getHelpKeyword()
    }
  }
  clearHistory = () => {
    this.setData({
      historyKeyword: []
    })
    Taro.removeStorageSync('history_keyword')
  }
  getGoodsList = () => {
    let self = this
    Taro.request({
      url: config.base_url + '/api/book/search',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      method: 'POST',
      data: {
        keyword: self.data.keyword.trim()
      },
      success: res => {
        if (res.data.ok) {
          self.setData({
            searchStatus: true,
            categoryFilter: false,
            goodsList: res.data.list.filter(item => {
              return (
                item.name === '家' || item.name === '春' || item.name === '秋'
              )
            }),
            filterCategory: res.data.classification.map((item, index) => {
              return {
                name: item,
                index: index,
                checked: false
              }
            })
          })
        } else {
          self.showToast('搜索书籍失败', 'bottom')
        }
        // 写入搜索历史
        let oldHistory = Taro.getStorageSync('history_keyword') || []
        if (oldHistory.indexOf(self.data.keyword.trim()) < 0) {
          oldHistory.push(self.data.keyword.trim())
          Taro.setStorageSync('history_keyword', oldHistory)
        }
      }
    })
  }
  onKeywordTap = event => {
    this.getSearchResult(event.target.dataset.keyword)
  }
  getSearchResult = keyword => {
    this.setData({
      keyword: keyword,
      page: 1,
      categoryId: 0,
      goodsList: []
    })

    this.getGoodsList()
  }
  openSortFilter = event => {
    let currentId = event.currentTarget.id
    switch (currentId) {
      case 'categoryFilter':
        this.setData({
          categoryFilter: !this.data.categoryFilter,
          currentSortOrder: 'asc'
        })
        break
      case 'priceSort':
        let tmpSortOrder = 'asc'
        if (this.data.currentSortOrder == 'asc') {
          tmpSortOrder = 'desc'
        }
        this.setData({
          currentSortType: 'price',
          currentSortOrder: tmpSortOrder,
          categoryFilter: false
        })

        this.getGoodsList()
        break
      default:
        //综合排序
        this.setData({
          currentSortType: 'default',
          currentSortOrder: 'desc',
          categoryFilter: false
        })
        this.getGoodsList()
    }
  }
  selectCategory = event => {
    let currentIndex = event.target.dataset.categoryIndex
    let filterCategory = this.data.filterCategory
    filterCategory.forEach(item => {
      if (item.index === currentIndex) {
        item.checked = true
      } else {
        item.checked = false
      }
    })
    this.setData({
      filterCategory: filterCategory,
      categoryFilter: false,
      page: 1,
      goodsList: []
    })
    this.getGoodsList()
  }
  onKeywordConfirm = event => {
    this.getSearchResult(event.detail.value)
  }
  showToast = (content, position) => {
    let self = this
    self.setData({
      toast: {
        show: true,
        content: content,
        position: position
      }
    })
    setTimeout(function() {
      self.setData({
        toast: {
          show: false,
          content: '',
          position: 'bottom'
        }
      })
    }, 3000)
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '首页',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      keyword,
      defaultKeyword,
      historyKeyword,
      hotKeyword,
      helpKeyword,
      searchStatus,
      currentSortType,
      categoryFilter,
      filterCategory,
      goodsList
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <ScrollView className="container" style="height: 100%;">
          <View className="search-header">
            <View className="input-box">
              <Image
                className="icon"
                src="http://nos.netease.com/mailpub/hxm/yanxuan-wap/p/20150730/style/img/icon-normal/search2-2fb94833aa.png"
              ></Image>
              <Input
                name="input"
                className="keywrod"
                value={keyword}
                confirmType="search"
                onInput={this.inputChange}
                onFocus={this.inputFocus}
                onConfirm={this.onKeywordConfirm}
                confirmType="search"
                placeholder={defaultKeyword}
              ></Input>
              {keyword && (
                <Image
                  className="del"
                  onClick={this.clearKeyword}
                  src="http://nos.netease.com/mailpub/hxm/yanxuan-wap/p/20150730/style/img/icon-normal/clearIpt-f71b83e3c2.png"
                ></Image>
              )}
            </View>
            <View className="right" onClick={this.closeSearch}>
              取消
            </View>
          </View>
          {!searchStatus && (
            <View className="no-search">
              {!keyword && historyKeyword.length && (
                <View className="serach-keywords search-history">
                  <View className="h">
                    <Text className="title">历史记录</Text>
                    <I
                      className="icon iconfont icon-shanchu"
                      onClick={this.clearHistory}
                    ></I>
                  </View>
                  <View className="b">
                    {historyKeyword.map((item, index) => {
                      return (
                        <View
                          className="item"
                          onClick={this.onKeywordTap}
                          data-keyword={item}
                          key={index}
                          hoverClass="navigator-hover"
                        >
                          {item}
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}
              {!keyword && (
                <View className="serach-keywords search-hot">
                  <View className="h">
                    <Text className="title">热门搜索</Text>
                  </View>
                  <View className="b">
                    {hotKeyword.map((item, index) => {
                      return (
                        <View
                          className={
                            'item ' + (item.is_hot === 1 ? 'active' : '')
                          }
                          hoverClass="navigator-hover"
                          onClick={this.onKeywordTap}
                          data-keyword={item}
                          key={index}
                        >
                          {item}
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}
              {keyword && (
                <View className="shelper-list">
                  {helpKeyword.map((item, index) => {
                    return (
                      <View
                        className="item"
                        hoverClass="navigator-hover"
                        key={index}
                        onClick={this.onKeywordTap}
                        data-keyword={item}
                      >
                        {item}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}
          {searchStatus && goodsList.length && (
            <View className="search-result">
              <View className="sort">
                <View className="sort-box">
                  <View
                    className={
                      'item ' + (currentSortType == 'default' ? 'active' : '')
                    }
                    onClick={this.openSortFilter}
                    id="defaultSort"
                  >
                    <Text className="txt">综合</Text>
                  </View>
                  <View
                    className={
                      'item ' + (currentSortType == 'category' ? 'active' : '')
                    }
                    onClick={this.openSortFilter}
                    id="categoryFilter"
                  >
                    <Text className="txt">分类</Text>
                  </View>
                </View>
                {categoryFilter && (
                  <View className="sort-box-category">
                    {filterCategory.map((item, index) => {
                      return (
                        <View
                          className={'item ' + (item.checked ? 'active' : '')}
                          key={'cate-' + index}
                          data-category-index={index}
                          onClick={this.selectCategory}
                        >
                          {item.name}
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
              {/*  搜索结果  */}
              <View className="books">
                {goodsList.map((item, index) => {
                  return (
                    <Navigator url="/pages/shutcheck/shutcheck" key="item._id">
                      <View className="book-item">
                        <LazyloadImg
                          className="book-img"
                          src={item.img_url}
                        ></LazyloadImg>
                        {/*  <image class="book-img fade-in" src="../../static/img/book-loading.svg"></image>  */}
                        <View className="book-info">
                          <Text className="book-name">{item.name}</Text>
                          <Text className="book-des">{item.des}</Text>
                          <View className="book-author">
                            <Icon className="iconfont icon-hezuozuozhe"></Icon>
                            {item.author}
                          </View>
                        </View>
                      </View>
                    </Navigator>
                  )
                })}
              </View>
            </View>
          )}
          {!goodsList.length && searchStatus && (
            <View className="search-result-empty">
              <NoData text="无搜索结果" subText="您搜索的书籍暂未上架"></NoData>
            </View>
          )}
        </ScrollView>
      </Block>
    )
  }
}

export default _C
