/**
 * 首页banner组件
 */
import Taro, { Component } from '@tarojs/taro'
import { Image, Swiper, SwiperItem } from '@tarojs/components'

import './banner.scss'

interface BannerItem {
  des: string // banner描述
  img_url: string // 图片地址
  type: number // banner类型
  url: string // 跳转地址
  _id: string // banner唯一id
}

interface IProps {
  data: Array<BannerItem> // banner数据
}

export default class Banner extends Component<IProps, void> {
  render () {
    const { data } = this.props;
    return (
      <Swiper
        className="comp-banner"
        indicatorColor="#999"
        indicatorActiveColor="#333"
        circular
        indicatorDots
        autoplay>
        {data.map(item => (
          <SwiperItem key={item._id}>
            <Image className="banner-img" src={item.img_url} mode="scaleToFill" />
          </SwiperItem>
        ))}
      </Swiper>
    )
  }
}
