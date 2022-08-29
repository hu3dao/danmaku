<script lang='ts' setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Danmaku from '../src/danmaku';
import Danmu from './components/danmu.vue'
import { faker } from "@faker-js/faker"

const isShow = ref<boolean>(false)
const toolsStyle = reactive({
  top: '0px',
  left: '0px'
})
interface IDanmuProps {
  avatar1: string
  avatar2: string
  text: string
}
let danmaku: Danmaku<IDanmuProps> | null = null
onMounted(() => {
  initDanmaku()
  faker.locale = 'zh_CN'
  // randomAddData()
})

const randomAddData = () => {
  const list: IDanmuProps[] = []
  for (let i = 0; i < 10; i++) {
    const avatar1 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_boy.png?imageMogr2/format/png/thumbnail/90x"
    const avatar2 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_girl.png?imageMogr2/format/png/thumbnail/90x"
    const text = faker.lorem.words(Math.ceil(Math.random() * 6 + 2))
    list.push({
      avatar1,
      avatar2,
      text
    })
  }
  danmaku?.add(list)
}

const mockDanmu = (): IDanmuProps[] => {
  const avatar1 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_boy.png?imageMogr2/format/png/thumbnail/90x"
  const avatar2 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_girl.png?imageMogr2/format/png/thumbnail/90x"
  const text = faker.lorem.words(Math.floor(Math.random() * 8))
  return [{
    avatar1,
    avatar2,
    text
  }]
}

const initDanmaku = () => {
  danmaku = new Danmaku<IDanmuProps>(".danmaku", Danmu, { trackHeight: 50, maxTrack: 6 })
  danmaku.onChoose((position: { left: number, top: number } | undefined) => {
    if (position) {
      toolsStyle.top = `${position.top}px`
      toolsStyle.left = `${position.left}px`
      isShow.value = true
    }
  })
  danmaku.onUnchoose(() => {
    console.log('未选中');
    isShow.value = false
  })
}
let timer = null
const handlePlay = () => {
  danmaku?.start()
  timer = setTimeout(function insertBarrage() {
    let sumScroll = 1 + Math.floor(12 * Math.random());
    while (sumScroll--) {
      danmaku?.add(mockDanmu());
    }
    timer = setTimeout(insertBarrage, 1000 + Math.floor(Math.random() * 5000));
  }, 300);
}
const handlePause = () => {
  danmaku?.stop()
}
const handleEnded = () => {
  danmaku?.clear()
}
const danmuText = ref<string>("这是一条弹幕")
const sendDanmu = () => {
  const avatar1 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_boy.png?imageMogr2/format/png/thumbnail/90x"
  const avatar2 = "https://quyuehui-1251661065.image.myqcloud.com/client/avatar/quyue_girl.png?imageMogr2/format/png/thumbnail/90x"
  const danmu = [
    {
      avatar1,
      avatar2,
      text: danmuText.value
    }
  ]
  danmaku?.add(danmu);
}
</script>

<template>
  <div class="container">
    <div class="content">
      <video src="https://vjs.zencdn.net/v/oceans.mp4" controls class="video-player" @play="handlePlay"
        @pause="handlePause" @ended="handleEnded"></video>
      <div class="danmaku">
        <div class="danmu-tools" v-show="isShow" :style="toolsStyle">点赞 投诉</div>
      </div>
    </div>
    <div class="tools">
      <input type="text" class="danmu-input" v-model="danmuText" />
      <button class="send-danmu-btn" @click="sendDanmu">发送弹幕</button>
      <!-- <input type="color" class="danmu-color-input"> -->
    </div>
  </div>
</template>

<style scoped>
input,
button {
  vertical-align: top;
  outline: none;
  border: none;
  box-sizing: border-box;
}

.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content {
  position: relative;
  width: 700px;

}

.video-player {
  position: absolute;
  top: 0;
  left: 150px;
  vertical-align: top;
  width: 400px;
}

.danmaku {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* overflow: hidden; */
  pointer-events: none;
}

.danmu-tools {
  position: absolute;
  color: red;
  transform: translateX(-50%);
}

.tools {
  height: 38px;
  margin-top: 20px;
}

.container input,
.container button {
  height: 100%;
  margin-right: 5px;
  border-radius: 5px;
}

.danmu-input {
  width: 300px;
  border: 1px solid #ccc;
}

.send-danmu-btn {
  color: #fff;
  background-color: skyblue;
  cursor: pointer;
}
</style>