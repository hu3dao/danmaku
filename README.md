## Introduction

danmaku 是一个弹幕引擎库，可以在指定的容器上显示弹幕，同时支持自定义弹幕的样式

## Installation

```
npm install @za/danmaku
```

## Usage

### 初始化

```js
import Danmaku from "danmaku";
// 第一个参数为弹幕容器
new Danmaku(".danmu-wrapper", {
  maxTrack: 3, // 最多展示几行弹幕
  loop: true, // 是否循环弹幕
  duration: 5000, // 弹幕的显示时长
  autoPlay: true, // 是否自动播放滚动弹幕
  style: {
    // 当不穿render渲染器时，danmaku会为每一条弹幕创建<div>节点，style对象会直接设置到这个节点上，遵循css规则，当使用内置的渲染时，danmus值如下
    fontSize: "20px",
    color: "#000",
  },
  danmus: [
    // 弹幕的数据
    { text: "弹幕1" },
    { text: "弹幕2" },
    { text: "弹幕3" },
    { text: "弹幕4" },
    { text: "弹幕5" },
    { text: "弹幕6" },
  ],
  // 自定义渲染器，props是上面danmus里面的每一项即{ text: "弹幕1" }，当存在render字段时，style字段将会被忽略
  render(props) {
    const dom = document.createElement("div");
    render(h(DanmuVue, props), dom);
    return dom;
  },
});
```

### API

- start()
  开启弹幕滚动
- stop()
  暂停弹幕滚动
- clear()
  清除弹幕
- emit(arg: T[] | T)
  发射弹幕

### vue3 例子

- 抽离弹幕组件

```
// Danmu.vue

<script lang='ts' setup>
defineProps({
  text: {
    type: String
  }
})
</script>

<template>
  <div class="danmu">{{text}}</div>
</template>

<style lang="scss" scoped>
.danmu {
  display: inline;
  font-size: 36px;
  color: skyblue;
  text-shadow: 2px 2px #ff0000;
}
</style>
```

- 在组件内使用

```
// App.vue

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

const isShow = ref(false);
const toggle = () => {
  isShow.value = !isShow.value;
};
</script>

<template>
  <button @click="toggle">切换</button>
  <div class="container" v-show="isShow">
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
```

### vue2 例子

- 弹幕组件

```
// Danmu.vue

<script>
export default {
  props: {
    text: {
      type: String,
    },
  },
};
</script>

<template>
  <div class="danmu">{{ text }}</div>
</template>

<style lang="scss" scoped>
.danmu {
  display: inline;
  font-size: 36px;
  color: skyblue;
  text-shadow: 2px 2px #ff0000;
}
</style>

```

- 在组件内使用

```
// App.vue

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

<script>
import Danmaku from "danmaku";
import Vue from "vue";
import Danmu from "./Danmu.vue";
export default {
  data() {
    return {
      danmaku: null,
      text: "",
    };
  },
  methods: {
    __initDanmaku() {
      this.danmaku = new Danmaku(".danmu-wrapper", {
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
          return new Vue({
            el: document.createElement("div"),
            render(h) {
              return h(Danmu, { props });
            },
          }).$el
        },
      });
    },
    handleEmit() {
      this.danmaku.emit({ text: this.text });
    },
    handleStart() {
      this.danmaku.start();
    },
    handleStop() {
      this.danmaku.stop();
    },
    handleClear() {
      this.danmaku.clear();
    },
  },
  mounted() {
    setTimeout(() => {
      this.__initDanmaku();
    }, 20);
  },
};
</script>

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
    width: 100%;
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

```
