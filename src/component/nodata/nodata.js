import { Block, View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './nodata.scss'

@withWeapp('Component')
class _C extends Taro.Component {
  static defaultProps = {
    text: '暂无数据',
    subText: '',
    btnText: '重新加载',
    showBtn: false
  }
  _observeProps = []
  state = {
    animation: ''
  }
  buttonClick = () => {
    var btnClickDetail = {} // detail对象，提供给事件监听函数
    var btnClickOption = {} // 触发事件的选项
    this.triggerEvent('btnclick', btnClickDetail, btnClickOption)
  }
  config = {
    component: true
  }

  render() {
    const { text, subText, btnText, showBtn } = this.props
    const {} = this.state
    return (
      <View className="no-data">
        {this.props.children}
        {(text ? true : false) && <View className="text">{text}</View>}
        {(subText ? true : false) && (
          <View className="sub-text">{subText}</View>
        )}
        {(showBtn ? true : false) && (
          <Button
            className="btn"
            type="default"
            size="mini"
            onClick={this.buttonClick}
          >
            {btnText}
          </Button>
        )}
      </View>
    )
  }
}

export default _C
