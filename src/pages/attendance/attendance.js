import { Block, View, Icon, Form, Button, PickerView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import FixedBtn from '../../component/fixed-btn/fixed-btn'
import Toast from '../../component/toast/toast'
import './attendance.scss'
//attendance.js
const config = require('../../config.js')
const app = Taro.getApp()
let choose_year = null
let choose_month = null

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    hasEmptyGrid: false,
    showPicker: false,
    hasDone: false,
    keepTimes: 0,
    present: 0,
    records: [],
    statusText: ''
  }

  componentDidShow() {
    // 获取我的签到记录
    this.getMyAttendance()
  }

  componentWillMount() {
    const date = new Date()
    const cur_year = date.getFullYear()
    const cur_month = date.getMonth() + 1
    const weeks_ch = ['日', '一', '二', '三', '四', '五', '六']
    this.calculateEmptyGrids(cur_year, cur_month)
    this.calculateDays(cur_year, cur_month)
    this.setData({
      cur_year,
      cur_month,
      weeks_ch
    })
    // 当前页面不予许分享
    Taro.hideShareMenu()
  }

  getThisMonthDays = (year, month) => {
    return new Date(year, month, 0).getDate()
  }
  getFirstDayOfWeek = (year, month) => {
    return new Date(Date.UTC(year, month - 1, 1)).getDay()
  }
  calculateEmptyGrids = (year, month) => {
    const firstDayOfWeek = this.getFirstDayOfWeek(year, month)
    let empytGrids = []
    if (firstDayOfWeek > 0) {
      for (let i = 0; i < firstDayOfWeek; i++) {
        empytGrids.push(i)
      }
      this.setData({
        hasEmptyGrid: true,
        empytGrids
      })
    } else {
      this.setData({
        hasEmptyGrid: false,
        empytGrids: []
      })
    }
  }
  calculateDays = (year, month) => {
    let self = this
    let days = []
    const thisMonthDays = self.getThisMonthDays(year, month)
    for (let i = 1; i <= thisMonthDays; i++) {
      days.push({
        day: i,
        choosed: false
      })
    }
    // 标记已经签到的日子
    month = month <= 9 ? '0' + month : month
    self.data.records.forEach(item => {
      days.forEach((dayItem, dayIndex) => {
        let day = dayItem.day <= 9 ? '0' + dayItem.day : dayItem.day
        let key = 'days[' + dayIndex + '].choosed'
        if (year + '/' + month + '/' + day === item) {
          days[dayIndex].choosed = true
        }
      })
    })
    self.setData({
      days
    })
  }
  handleCalendar = e => {
    const handle = e.currentTarget.dataset.handle
    const cur_year = this.data.cur_year
    const cur_month = this.data.cur_month
    if (handle === 'prev') {
      let newMonth = cur_month - 1
      let newYear = cur_year
      if (newMonth < 1) {
        newYear = cur_year - 1
        newMonth = 12
      }

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })

      this.calculateDays(newYear, newMonth)
      this.calculateEmptyGrids(newYear, newMonth)
    } else {
      let newMonth = cur_month + 1
      let newYear = cur_year
      if (newMonth > 12) {
        newYear = cur_year + 1
        newMonth = 1
      }

      this.setData({
        cur_year: newYear,
        cur_month: newMonth
      })

      this.calculateDays(newYear, newMonth)
      this.calculateEmptyGrids(newYear, newMonth)
    }
  }
  tapDayItem = e => {
    const idx = e.currentTarget.dataset.idx
    const days = this.data.days
    days[idx].choosed = !days[idx].choosed
    this.setData({
      days
    })
  }
  chooseYearAndMonth = () => {
    const cur_year = this.data.cur_year
    const cur_month = this.data.cur_month
    let picker_year = []
    let picker_month = []
    for (let i = 1900; i <= 2100; i++) {
      picker_year.push(i)
    }
    for (let i = 1; i <= 12; i++) {
      picker_month.push(i)
    }
    const idx_year = picker_year.indexOf(cur_year)
    const idx_month = picker_month.indexOf(cur_month)
    this.setData({
      picker_value: [idx_year, idx_month],
      picker_year,
      picker_month,
      showPicker: true
    })
  }
  pickerChange = e => {
    const val = e.detail.value
    choose_year = this.data.picker_year[val[0]]
    choose_month = this.data.picker_month[val[1]]
  }
  tapPickerBtn = e => {
    const type = e.currentTarget.dataset.type
    const o = {
      showPicker: false
    }
    if (type === 'confirm') {
      o.cur_year = choose_year
      o.cur_month = choose_month
      this.calculateEmptyGrids(choose_year, choose_month)
      this.calculateDays(choose_year, choose_month)
    }

    this.setData(o)
  }
  doAttendance = event => {
    let self = this
    Taro.request({
      method: 'GET',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      url: config.base_url + '/api/attendance',
      success: res => {
        if (res.data.ok) {
          self.setData({
            hasDone: true,
            keepTimes: res.data.keep_times,
            records: res.data.records,
            present: res.data.present
          })
          self.calculateEmptyGrids(self.data.cur_year, self.data.cur_month)
          self.calculateDays(self.data.cur_year, self.data.cur_month)
          Taro.showToast({ title: '签到成功', icon: 'success' })
          setTimeout(function() {
            Taro.hideToast()
          }, 1000)
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast(
            '签到失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: err => {
        self.showToast('获取签到记录失败', 'bottom')
      }
    })
    app.reportFormId('attendance', event.detail.formId)
  }
  getMyAttendance = () => {
    let self = this
    Taro.request({
      method: 'GET',
      header: { Authorization: 'Bearer ' + app.globalData.token },
      url: config.base_url + '/api/attendance/me',
      success: res => {
        if (res.data.ok) {
          // 设定statusText
          let statusText = ''
          if (res.data.keep_times >= 0 && res.data.keep_times < 3) {
            statusText = '还差' + (3 - res.data.keep_times) + '天获得100积分'
          } else if (res.data.keep_times >= 3 && res.data.keep_times < 15) {
            statusText = '还差' + (15 - res.data.keep_times) + '天获得150积分'
          } else if (res.data.keep_times >= 15 && res.data.keep_times < 30) {
            statusText = '还差' + (30 - res.data.keep_times) + '天获得200积分'
          }
          self.setData({
            hasDone: !!res.data.has_done,
            keepTimes: res.data.keep_times,
            records: res.data.records,
            present: res.data.present,
            statusText: statusText
          })
          self.calculateEmptyGrids(self.data.cur_year, self.data.cur_month)
          self.calculateDays(self.data.cur_year, self.data.cur_month)
        } else if (res.data.authfail) {
          Taro.navigateTo({
            url: '../loading/loading?need_login_again=1'
          })
        } else {
          self.showToast(
            '获取签到记录失败' + (res.data.msg ? '，' + res.data.msg : ''),
            'bottom'
          )
        }
      },
      fail: err => {
        self.showToast('获取签到记录失败', 'bottom')
      }
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
    navigationBarTitleText: '每日签到',
    navigationBarTextStyle: 'white'
  }

  render() {
    const {
      toast,
      cur_year,
      cur_month,
      keepTimes,
      weeks_ch,
      empytGrids,
      hasEmptyGrid,
      days,
      hasDone,
      records,
      present,
      statusText,
      picker_value,
      picker_year,
      picker_month,
      showPicker
    } = this.state
    return (
      <Block>
        <Toast toast={toast}></Toast>
        <FixedBtn></FixedBtn>
        <View className="flex box box-tb box-align-center">
          <View className="white-box"></View>
          <View className="calendar box box-tb">
            <View className="top-handle box box-lr box-pack-between box-pack-center">
              <View
                className="prev box box-rl"
                onClick={this.handleCalendar}
                data-handle="prev"
              >
                <View className="prev-handle box box-lr box-align-center box-pack-center">
                  前一个月
                </View>
              </View>
              <View
                onClick={this.chooseYearAndMonth}
                className="date-area box box-lr box-align-center box-pack-center"
              >
                {(cur_year || '--') + ' 年 ' + (cur_month || '--') + ' 月'}
              </View>
              <View
                className="next box box-lr"
                onClick={this.handleCalendar}
                data-handle="next"
              >
                <View className="next-handle box box-lr box-align-center box-pack-center">
                  后一个月
                </View>
              </View>
            </View>
            <View className="tu-ding">
              <Icon className="tu-ding-left"></Icon>
              <Icon className="tu-ding-right"></Icon>
            </View>
            <View className="keep-day">{'连续签到' + keepTimes + '天啦~'}</View>
            <View className="weeks box box-lr box-pack-center box-align-center">
              {weeks_ch.map((item, index) => {
                return (
                  <View className="flex week fs28" key={index} data-idx={index}>
                    {item}
                  </View>
                )
              })}
            </View>
            {empytGrids.map((item, index) => {
              return (
                <View className="days box box-lr box-wrap">
                  {hasEmptyGrid && (
                    <Block>
                      {empytGrids.map((item, index) => {
                        return (
                          <View
                            className="grid white-color box box-align-center box-pack-center"
                            key={index}
                            data-idx={index}
                          ></View>
                        )
                      })}
                    </Block>
                  )}
                  {days.map((item, index) => {
                    return (
                      <View
                        className="grid white-color box box-align-center box-pack-center"
                        key={index}
                        data-idx={index}
                      >
                        <View
                          className={
                            'day ' +
                            (item.choosed ? 'foot-bg' : '') +
                            ' box box-align-center box-pack-around'
                          }
                        >
                          {item.day}
                        </View>
                      </View>
                    )
                  })}
                </View>
              )
            })}
            <Form
              className="form"
              onSubmit={this.doAttendance}
              reportSubmit="true"
            >
              <Button className="yaoyiyao" disabled={hasDone} formType="submit">
                {hasDone ? '已签到' : '立即签到'}
              </Button>
            </Form>
          </View>
        </View>
        <View className="rank">
          {records.length > 0
            ? '打败了' + present + '%的小伙伴，继续加油!'
            : '快去签到吧~'}
        </View>
        <View className="rule">
          <View className="title">奖励规则</View>
          <View className="status">{statusText}</View>
          <View className={'text ' + (hasDone ? 'done' : '')}>
            每天签到送5书币
          </View>
          <View className={'text ' + (keepTimes === 3 ? 'done' : '')}>
            连续签到3天 额外获得10书币
          </View>
          <View className={'text ' + (keepTimes === 7 ? 'done' : '')}>
            连续签到7天 额外获得15书币
          </View>
          <View className={'text ' + (keepTimes === 15 ? 'done' : '')}>
            连续签到15天 额外获得20书币
          </View>
          <View className={'text ' + (keepTimes === 30 ? 'done' : '')}>
            连续签到30天 额外获得30书币
          </View>
        </View>
        {showPicker && (
          <View className="picker-container box box-tb">
            <View className="picker-btns box box-lr box-pack-between box-align-center">
              <View
                className="picker-btn picker-cancel"
                data-type="cancel"
                onClick={this.tapPickerBtn}
              >
                取消
              </View>
              <View
                className="picker-btn picker-confirm"
                data-type="confirm"
                onClick={this.tapPickerBtn}
              >
                确定
              </View>
            </View>
            <PickerView
              className="flex"
              indicatorStyle="height: 50px;"
              style="width: 100%; height: 150px;"
              value={picker_value}
              onChange={this.pickerChange}
            >
              <PickerViewColumn>
                {picker_year.map((item, index) => {
                  return (
                    <View
                      className="picker-view"
                      key={index}
                      style="line-height: 50px"
                    >
                      {item + '年'}
                    </View>
                  )
                })}
              </PickerViewColumn>
              <PickerViewColumn>
                {picker_month.map((item, index) => {
                  return (
                    <View
                      className="picker-view"
                      key={index}
                      style="line-height: 50px"
                    >
                      {item + '月'}
                    </View>
                  )
                })}
              </PickerViewColumn>
            </PickerView>
          </View>
        )}
      </Block>
    )
  }
}

export default _C
