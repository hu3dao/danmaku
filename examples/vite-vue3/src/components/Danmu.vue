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