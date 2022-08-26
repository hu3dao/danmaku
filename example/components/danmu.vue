<script lang='ts' setup>
import { defineProps } from 'vue'
defineProps({
  avatar1: {
    type: String
  },
  avatar2: {
    type: String
  },
  text: {
    type: String
  }
})
</script>

<template>
  <div class="danmu">
    <img :src="avatar1" alt=""><img :src="avatar2" alt=""><span>{{ text }}</span>
  </div>
</template>

<style scoped>
.danmu {
  color: skyblue;
  display: inline-block;
  display: flex;
  align-items: center;
  pointer-events: none;
}

img {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: 2px solid gold;
}

span {
  margin-left: 8px;
  font-size: 26px;
}
</style>