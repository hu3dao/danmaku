<script setup lang="ts">
import { onMounted, render, h, ref } from "vue";
import Danmaku from "danmaku";
import DanmuVue from "./components/Danmu.vue";
let danmaku = ref<Danmaku<{ text: string }> | null>(null);
onMounted(() => {
  danmaku.value = new Danmaku<{ text: string }>(".danmu-wrapper", {
    maxTrack: 3,
    loop: true,
    danmus: [
      { text: "弹幕1" },
      { text: "弹幕2" },
      { text: "弹幕3" },
      { text: "弹幕4" },
      { text: "弹幕5" },
      { text: "弹幕6" },
    ],
    render(props) {
      const dom = document.createElement("div");
      render(h(DanmuVue, props), dom);
      return dom;
    },
  });
});

const text = ref("");
const handleEmit = () => {
  danmaku.value?.emit({ text: text.value });
};
const handleStart = () => {
  danmaku.value?.start();
};
const handleStop = () => {
  danmaku.value?.stop();
};
const handleClear = () => {
  danmaku.value?.clear();
};

const isShow = ref(true);
const toggle = () => {
  isShow.value = !isShow.value;
};
</script>

<template>
  <div class="container">
    <div class="video-wrapper">
      视频区域
      <div class="danmu-wrapper"></div>
    </div>
    <div class="emit-box">
      <input type="text" v-model="text" />
      <button @click="handleEmit">发射弹幕</button>
    </div>
    <div class="tools">
      <button @click="handleStart">开始</button>
      <button @click="handleStop">暂停</button>
      <button @click="handleClear">清除</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  padding-top: 200px;
}
.video-wrapper {
  position: relative;
  margin: 0 auto;
  width: 718px;
  height: 607px;
  box-shadow: 0 0 0 1px #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 64px;
  font-weight: bold;
  color: #ddd;
  .danmu-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 718px;
    height: 100%;
    overflow: hidden;
  }
}
.emit-box {
  margin-top: 36px;
  display: flex;
  justify-content: center;
  button {
    margin-left: 12px;
  }
}
.tools {
  margin-top: 36px;
  display: flex;
  justify-content: space-around;
}
</style>
