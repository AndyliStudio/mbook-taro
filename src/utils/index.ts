import Taro from '@tarojs/taro'

export function getStorage(key) {
  return Taro.getStorage({ key }).then(res => res.data).catch(() => '')
}

export function setStorage(key, data) {
  return Taro.setStorage({ key, data })
}

export function getQueryParams(qs) {
  qs = qs.split('+').join(' ');
  const params = {};
  let tokens : any = null;
  const re = /[?&]?([^=]+)=([^&]*)/g;
  while (tokens = re.exec(qs)) {
      params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }
  return params;
}
