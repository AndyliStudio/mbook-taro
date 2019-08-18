import { Block, View, Text, OpenData } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './redpock.scss'

@withWeapp('Component')
class _C extends Taro.Component {
  static defaultProps = {
    text: '送你一个红包'
  }
  _observeProps = []
  state = {
    opened: false,
    closed: false
  }
  openIt = () => {
    this.setData({ opened: true })
    this.triggerEvent('open')
  }
  closeIt = () => {
    this.setData({ opened: false, closed: true })
  }
  config = {
    component: true
  }

  render() {
    const { text } = this.props
    const { closed, opened } = this.state
    return (
      <View className={'redpock ' + (closed ? 'zoomOutDown' : 'zoomInUp')}>
        <Text className="iconfont icon-close" onClick={this.closeIt}></Text>
        {/*   红包的顶部盖子  */}
        <View className="topcontent"></View>
        {/*  拆红包的按钮  */}
        <View className="redpock-open">
          <OpenData className="avatar rotate" type="userAvatarUrl"></OpenData>
        </View>
        <OpenData className="name" type="userNickName"></OpenData>
        <View className="redpock-text">{text}</View>
        <View
          className={'btn ' + (opened ? 'rotate' : '')}
          onClick={this.openIt}
        >
          開
        </View>
      </View>
    )
  }
}

export default _C
