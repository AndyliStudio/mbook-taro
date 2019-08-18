import { Block, View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './modal.scss'

@withWeapp('Component')
class _C extends Taro.Component {
  static defaultProps = {
    visible: false,
    animation: true,
    opacity: 0.4,
    title: '',
    showClose: true,
    showFooter: true,
    closeOnClickModal: true,
    confirmText: '确认',
    fullscreen: false,
    width: 85,
    position: 'center'
  }
  _observeProps = [
    {
      name: 'visible',
      observer: function(newVal) {
        if (newVal) {
          this.triggerEvent('open')
          Taro.pageScrollTo({
            scrollTop: 0,
            duration: 100
          })
        }
      }
    },
    {
      name: 'position',
      observer: function(newVal) {
        this.setData({
          _posttion: this.checkPosition(newVal) ? newVal : 'center'
        })
      }
    }
  ]
  state = {
    positions: ['center', 'top', 'bottom'],
    _posttion: 'center'
  }
  attached = () => {
    this.setData({
      _posttion: this.checkPosition(this.data.position)
        ? this.data.position
        : 'center'
    })
    if (!this.dataset.model) {
      console.warn("dialog-wxapp: dataset 'model' undefined")
    }
  }
  moved = () => {}
  detached = () => {}
  checkPosition = val => {
    return this.data.positions.indexOf(val) >= 0
  }
  touchstart = () => {
    if (this.data.closeOnClickModal) {
      this.close()
    }
  }
  closedialog = () => {
    if (this.dataset.model) {
      let currentPage = Taro.getCurrentPages().pop()
      let data = {}
      data[this.dataset.model] = false
      currentPage.setData(data)
    }
  }
  close = () => {
    this.closedialog()
    this.triggerEvent('close')
  }
  confirm = () => {
    this.closedialog()
    this.triggerEvent('confirm')
  }
  config = {
    component: true
  }

  render() {
    const {
      visible,
      animation,
      opacity,
      title,
      showClose,
      showFooter,
      closeOnClickModal,
      confirmText,
      fullscreen,
      width,
      position
    } = this.props
    const {} = this.state
    return (
      visible && (
        <View className="dialog-wxapp">
          <View
            className="dialog-wxapp-mask"
            style={'background: rgba(0, 0, 0, ' + opacity + ');'}
            onTouchStart={this.touchstart}
          ></View>
          <View
            className="dialog-wxapp-main"
            style={
              'height:' +
              (fullscreen ? '100%' : 'auto') +
              ';' +
              (position == 'center'
                ? 'top: 50%; transform: translateY(-50%);'
                : position == 'top'
                ? 'top:0;'
                : 'bottom:0;')
            }
          >
            <View
              className={
                'dialog-wxapp-container ' +
                (animation ? 'dialog-wxapp-animation' : '')
              }
              style={
                'width: ' +
                (fullscreen ? '100' : width) +
                '%; height:' +
                (fullscreen ? '100%' : 'auto') +
                ';'
              }
            >
              {title.length > 0 && (
                <View className="dialog-wxapp-container__title">
                  <View>{title}</View>
                  <View>
                    {showClose && (
                      <Image
                        onClick={this.close}
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB+ElEQVR4Ac3XNWIbQRTG8RfmyqLeowOE6RjBNoxmZrsyXMDs1tBGh1Aawx2CZlfhTP7FbFi7b8TFT/AW5hMMydmzZ7VO4hYmkMV7fHTeu9qEO+ckRENzksE0dpBBPS4jiSNO0tXqkcEOpmEKCXAUI3iPIcQhSgkM4T1GcdQ3QC1WsIQUJE8pLGEFRhvgDF7jGaRInuE1zkQFMHiL65Aiu463MLkCHMMqnkNK5DnWcOx/AUaxBCmxRYz+HaAW60hBSiyJdZjfA0xjEJLDXHBcaRCzEcdnggCnsBPRz3tg0QyJ0AyL7pBz4tjBKXFDZwYSoREWnSHndMK6cyVCBreEhynUQRS6YNET8i11QRTqMCU8ZHEVotQKi9awmsIVZIWHDcQhHuph8dCxqId4iGNDePiEwxBPD2CdBxBPh/GpkACPYJ1HhQTI5ydohsVdx6I5358giysQpa7/dLUmWHT6/wn9umEPLDq1XTTEc0zpByJdVwvOadEPRLqhuA8W9R5dtFc7FAtmIiabqeCGSj2YguQwgBlIUDBYR7KM03G6kguSsVxLsrUyLcmOV3RRWtXL8oDBGhYKXCcmsYA1mHy2ZqNYxwBiEKUYBrCu3pqFSGMau3iBOlxCAoechKvVuXP2MIM0JIzv9vw2JvES6/jsrLvapDvnJETjB6uu9U2HOlCCAAAAAElFTkSuQmCC"
                      ></Image>
                    )}
                  </View>
                </View>
              )}
              <View className="dialog-wxapp-container__body">
                {this.props.children}
              </View>
              {showFooter && (
                <View className="dialog-wxapp-container__footer">
                  <View
                    className="dialog-wxapp-container__footer__cancel"
                    onClick={this.close}
                  >
                    取消
                  </View>
                  <View
                    className="dialog-wxapp-container__footer__confirm"
                    onClick={this.confirm}
                  >
                    {confirmText}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      )
    )
  }
}

export default _C
