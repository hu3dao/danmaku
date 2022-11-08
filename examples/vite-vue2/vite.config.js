import { createVuePlugin } from 'vite-plugin-vue2'
import postCssPxToRem from 'postcss-pxtorem'

export default {
  plugins: [createVuePlugin()],
  css: {
    postcss:{
      plugins:[
        postCssPxToRem({
          rootValue:37.5,   //1rem的大小
          propList:['*'],   //需要转换的属性
          selectorBlackList:[".norem"]     //过滤掉不需要转换的类名
        })
      ]
  }
}
}