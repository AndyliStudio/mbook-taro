import Taro from '@tarojs/taro'
/**
 * 格式化日期，转变成'2017/11/19 00:00:00'
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

/**
 * 格式化日期，转变成'一分钟前，一天前..'
 * @returns {String} '一分钟前，一天前..'
 */
const transDate = date => {
  let resultStr = ''
  let timePre = date.getTime()
  let now = new Date()
  let timeNow = now.getTime()
  if (timeNow >= timePre) {
    let distance = (timeNow - timePre) / 1000
    if (distance >= 0 && distance < 60) {
      resultStr = '刚刚'
    } else if (distance >= 60 && distance <= 3600) {
      resultStr = Math.floor(distance / 60) + '分钟前'
    } else if (distance > 3600 && distance <= 86400) {
      resultStr = Math.floor(distance / 3600) + '小时前'
    } else if (distance > 86400 && distance / 2592000) {
      resultStr = Math.floor(distance / 86400) + '天前'
    } else {
      resultStr = formatTime(date)
    }
  } else {
    console.warn('nowTime is behind on this time')
  }
  return resultStr
}

/**
 * 获取当前页面路径
 * @returns {String} 不带参数的路径
 */
const getCurrentPageUrl = function() {
  let pages = Taro.getCurrentPages() //获取加载的页面
  let currentPage = pages[pages.length - 1] //获取当前页面的对象
  let url = currentPage.is //当前页面url
  return url
}

/**
 * 获取当前页面路径
 * @returns {String} 不带参数的路径
 */
const getCurrentPageUrlWithArgs = function() {
  let pages = Taro.getCurrentPages() //获取加载的页面
  let currentPage = pages[pages.length - 1] //获取当前页面的对象
  let url = currentPage.is //当前页面url
  let options = currentPage.options //如果要获取url中所带的参数可以查看options

  //拼接url的参数
  let urlWithArgs = url + '?'
  for (let key in options) {
    let value = options[key]
    urlWithArgs += key + '=' + value + '&'
  }
  urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)
  return urlWithArgs
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 判断当前字符串是否json字符串
 */
const isJsonString = str => {
  try {
    JSON.parse(str)
    return true
  } catch (err) {
    return false
  }
}

const copyObject = (target, source) => {
  if (target == null) {
    throw new TypeError('target can not be undefined or null')
    return false
  }
  let to = new Object(target)
  if (source != null) {
    for (let nextKey in source) {
      // Avoid bugs when hasOwnProperty is shadowed
      if (
        Object.prototype.hasOwnProperty.call(source, nextKey) &&
        Object.prototype.hasOwnProperty.call(target, nextKey)
      ) {
        to[nextKey] = source[nextKey]
      }
    }
  }
  return to
}

module.exports = {
  formatTime: formatTime,
  transDate: transDate,
  getCurrentPages: getCurrentPageUrl,
  getCurrentPageUrlWithArgs: getCurrentPageUrlWithArgs,
  isJsonString: isJsonString,
  copyObject: copyObject
}
