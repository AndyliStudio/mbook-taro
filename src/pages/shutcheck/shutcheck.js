import { Block, View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import withWeapp from '@tarojs/with-weapp'
import './shutcheck.scss'
// pages/shutcheck/shutcheck.js
const app = Taro.getApp()

@withWeapp('Page')
class _C extends Taro.Component {
  state = {
    onLoad: function() {
      // 当前页面不予许分享
      Taro.hideShareMenu()
    }
  }
  config = {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1472e0',
    navigationBarTitleText: '家春秋',
    navigationBarTextStyle: 'white'
  }

  render() {
    return (
      <View className="shutcheck">
        <View className="inner">
          <View className="title">家春秋</View>
          <View className="content">
            现代著名作家巴金的长篇小说《家》、《春》、《秋》，半个世纪以来深为广大人民所喜爱，并被译成多种文字，誉满天下。作品通过金陵城高公馆一家的盛衰，使读者看到了旧中国的没落与腐朽，深刻地揭露了封建家庭旧礼教的残酷，描写了在黑暗势力压迫下的年青人的不同命运：有的苦闷、彷徨，有的作了牺牲品，有的奋起反抗去追求光明。
            本书原由我社于1988年出版，现经修订，列入“现代故事画库”系列重新出版，以满足广大读者和连环画爱好者的收藏需求。
            <Image src="https://fs.andylistudio.com/1527176903690.jpeg"></Image>
            1987年的电视剧《家春秋》，荣获第七届“金鹰奖”优秀电视连续剧奖
            。这部片子先在四川取景，然后是在上海搭景拍摄完成的。改编人员曾为改编事宜，多次请教巴金：“过去改编主要突出的是觉慧，这也是原著的亮点。我们这次改编，编剧拟以觉新为主线，认为这是一个性格复杂的人物，开拓下去，戏路会更广阔。但是，我们心里不踏实，于是再一次去请教巴老……交谈中，我们体会到巴金……对觉慧这个人物是倾注了心血，寄予了厚望的……”
            在原著中，觉新最后还是有一个不算太灰色的结局，而在电视剧中，觉新最后走上了绝路。这部电视剧的悲，始终笼罩不散，连那主题歌曲与插曲都让人听得不寒而栗。
            最让人印象深刻的是不久前刚在央视拍摄完电视剧《红楼梦》的陈晓旭和张莉。《红楼梦》的明星效应实在太强大了。在林黛玉与薛宝钗后不久，人们再次看到陈晓旭与张莉出现在《家春秋》中。张莉的角色从雍容富态的宝钗变成了美丽丫头鸣凤，角色的反差稍微大一点。而陈晓旭，则完全令人们陷入梅表姐就是林黛玉的联想中无法自拔。一样的忧郁，一样的病态，一样的欲得未得……我们甚至还能从某些相对静止的画面中读出一些尖酸刻薄，或者洞明犀利来。很明显这一部《家春秋》中，渲染梅表姐与觉新的爱情戏比较用心。当陈晓旭站在梅花丛中微笑时，有比葬花更动人的效果。
            饰演完美瑞珏的是长相温柔的徐娅，她还演过《封神榜》里的青君、《孙中山与宋庆龄》里的宋庆龄，都是同一路子的善良得体女子。
            与之前拍的电影不同，电视剧《家春秋》对觉新之外的副线人物刻画也很仔细，于是我们还留下了对其他几个积极争取权益的女子的好感，她们更让人觉得激情澎湃。
            上海人此后经常见到的演员，例如吕凉、杨昆、孙启新等等，都在此片云集，让我们看到他们的最初面貌。
          </View>
        </View>
      </View>
    )
  }
}

export default _C
