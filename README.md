

# azure-text-to-speech



主要为了方便 阅读app <a href="https://gedoor.github.io/" target="_blank">https://gedoor.github.io/</a> 朗读功能的调用，使用cloudflare 的 Worker 转发接收的文本，然后发送到 azure 文本转语言的 REST API，最后返回转换后的音频。



Workers 一共可以设置6个变量，在 Workers 的 **设置** -- **变量** 里添加。

| 变量名称             | 解释                         | 默认值                                                       |
| -------------------- | ---------------------------- | ------------------------------------------------------------ |
| ENV_AUTHORIZATION    | 一个自定义的用于验证的字符串 | 默认为： kvzNEPnTfeKMZcdNgZnHHZvfAe ，在发送请求时需要包含 "Authorization": "kvzNEPnTfeKMZcdNgZnHHZvfAe" 的头部，不然会返回 Unauthorized 。建议自定义设置，提高安全性 |
| ENV_SUBSCRIPTION_KEY | API 密钥                     | 在 azure 网站语音服务的概述中可以查看。此环境变量也可不设置，通过请求的 Subscription-Key 字段来提供。密钥通过环境变量或者请求的头部提供，二者至少要有一个，优先使用请求头部提供的 |
| ENV_REGION           | 资源所在的区域               | 默认 eastus ，在 azure 网站语音服务的概述中可以查看          |
| ENV_VOICE_NAME       | 使用的语音库名称             | 默认 zh-CN-XiaoxiaoNeural ，就是语音库第一个的 晓晓          |
| ENV_OUTPUT_FORMAT    | 输出的音频格式               | 默认 riff-24khz-16bit-mono-pcm ，在 API 文档页面可以查看     |
| ENV_STYLE            | 音频的风格                   | 默认 gentle , 可以通过 API 查看都有那些风格，每个语音库拥有的风格不太一样 |



REST API 的文档网址：<a href="https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech" target="_blank">https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech</a>



#### 部署到 cloudflare 的 Worker

在 Workers 和 Pages 页面点 **创建应用程序**，然后点 **创建Worker**，输入一个Worker名称，点**部署**，一个 Worker 就创建好了。

点 **编辑代码** ，将 worker.js 文件中的所有内容复制到页面中，点 **部署** 并 **保存** ，然后返回上一步到Worker配置页面。

点 **设置** --> **变量** --> **添加变量** ，建议至少设置 ENV_AUTHORIZATION 和 ENV_SUBSCRIPTION_KEY 变量，ENV_REGION 根据实际设置，如果不是 eastus  ，那么就需要设置。

成功部署的标志是在浏览器中打开Worker的网址，会显示一个 Unauthorized 。Worker的网址在 **设置** --> **触发器** --> **路由** 里可以看到，单击打开就行。



如果普通网络无法访问部署好的 Worker 的话，可以给 Worker 设置一个单独的域名用来访问，同时关闭 IPv6 兼容性 , 默认使用 IPv4 ，一般来说就可以正常访问了。这一步非必须，设置的话需要有在 cloudflare 托管的域名。



##### 阅读app设置

在阅读界面，进入朗读设置，点 **朗读引擎** ，点 **+** 号添加朗读引擎，然后点 **三个点**，**粘贴源** 。粘贴内容根据实际情况修改：

如果上边没有配置 ENV_SUBSCRIPTION_KEY 环境变量，那么密钥就要通过请求头提供：

```
{
  "concurrentRate": "1",
  "contentType": "",
  "enabledCookieJar": false,
  "header": "{\"Content-Type\":\"application/json\",\"Authorization\":\"替换成ENV_AUTHORIZATION环境变量的内容\",\"Subscription-Key\":\"替换成azure的密钥\"}",
  "name": "azure-text-to-speech ",
  "url": "替换成你Worker的网址,{\"method\": \"POST\",\"body\": \"{\\\"text\\\": \\\"{{speakText}}\\\"}\"}"
}
```

假设密钥是 12345678901234567890 ，ENV_AUTHORIZATION 环境变量的内容是 kvzNEPnTfeKMZcdNgZnHHZvfAe ，Worker的网址是：https://hello-world-shiny-leaf-a71f.abcde.workers.dev/ ，那么粘贴的最终内容就是：

```
{
  "concurrentRate": "1",
  "contentType": "",
  "enabledCookieJar": false,
  "header": "{\"Content-Type\":\"application/json\",\"Authorization\":\"kvzNEPnTfeKMZcdNgZnHHZvfAe\",\"Subscription-Key\":\"12345678901234567890\"}",
  "name": "azure-text-to-speech ",
  "url": "https://hello-world-shiny-leaf-a71f.abcde.workers.dev/,{\"method\": \"POST\",\"body\": \"{\\\"text\\\": \\\"{{speakText}}\\\"}\"}"
}
```

如果已经配置了 ENV_SUBSCRIPTION_KEY 环境变量的话，就不需要Subscription-Key了：

```
{
  "concurrentRate": "1",
  "contentType": "",
  "enabledCookieJar": false,
  "header": "{\"Content-Type\":\"application/json\",\"Authorization\":\"替换成ENV_AUTHORIZATION环境变量的内容\"}",
  "name": "azure-text-to-speech ",
  "url": "替换成你Worker的网址,{\"method\": \"POST\",\"body\": \"{\\\"text\\\": \\\"{{speakText}}\\\"}\"}"
}
```

