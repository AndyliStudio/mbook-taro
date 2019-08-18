import { Block, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './toast.scss'

@withWeapp('Component')
class _C extends Taro.Component {
  static defaultProps = {
    toast: { show: false, content: 'hello', position: 'bottom' }
  }
  _observeProps = []
  state = {
    animation: ''
  }
  ready = () => {
    let animation = Taro.createAnimation({
      duration: 1000,
      timingFunction: 'linear'
    })
    animation.opacity(0.96).step()
    animation.opacity(0).step()
    this.setData({ animation: animation.export() })
  }
  config = {
    component: true
  }

  render() {
    const { toast } = this.props
    const { animation } = this.state
    return (
      toast.show && (
        <View
          className={
            'ths-toast ' +
            (toast.position == 'center' ? 'position-center' : 'position-bottom')
          }
        >
          <View
            className={'toast-txt ' + (toast.show ? 'fade-in' : 'fade-out')}
            animation={animation}
          >
            {toast.content}
          </View>
        </View>
      )
    )
  }
}

export default _C
