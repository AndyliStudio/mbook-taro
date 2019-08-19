/**
 * 发送统计 
 */
import Taro from '@tarojs/taro'
import fetch from './request'
import { API_LOG } from '../constants/api'

interface LogConfig {
  baseUrl: string;
}

export default class Log {
  baseUrl: string;
  constructor(options: LogConfig) {
    this.baseUrl = options.baseUrl
  }

  /**
   * 统计访问方法
   */
  sendAccessLog() {
    const channel = Taro.getStorageSync('channel')
    const userid = Taro.getStorageSync('userid')
    return fetch({
      method: 'GET',
      url: this.baseUrl,
      payload: {
        type: 'access',
        userid,
        channel
      },
      showToast: false,
      autoLogin: false
    })
  }

  /**
   * 统计事件方法
   * @param name 事件名称
   * @param params 事件参数
   */
  sendEventLog(name: string, params: any) {
    const channel = Taro.getStorageSync('channel')
    const userid = Taro.getStorageSync('userid')
    return fetch({
      method: 'GET',
      url: API_LOG,
      payload: {
        type: 'event',
        name,
        userid,
        channel,
        params
      },
      showToast: false,
      autoLogin: false
    })
  }
}
