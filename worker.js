addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // 从请求标头中读取订阅密钥和服务区域
  const subscriptionKey = request.headers.get("Subscription-Key");
  const serviceRegion = request.headers.get("Service-Region");

  // 如果未提供订阅密钥或服务区域，则返回错误响应
  if (!subscriptionKey || !serviceRegion) {
    return new Response("Missing Subscription-Key or Service-Region header", { status: 400 });
  }

  // 解析请求中的文本
  const { text } = await request.json();

  // 设置输出文件名
  const filename = "output.wav";

  // 使用 require 语句导入模块
  const sdk = require("microsoft-cognitiveservices-speech-sdk");

  // 创建语音合成器所需的配置
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
  const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

  // 创建语音合成器
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // 合成语音
  const result = await new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(text, result => resolve(result), error => reject(error));
  });

  // 关闭语音合成器
  synthesizer.close();

  // 检查合成结果并返回相应的音频文件或错误消息
  if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
    const audioFile = await readFile(filename);
    return new Response(audioFile, { headers: { 'Content-Type': 'audio/wav' } });
  } else {
    return new Response("Speech synthesis failed: " + result.errorDetails, { status: 500 });
  }
}

// 读取文件的辅助函数
async function readFile(filename) {
  const file = await fetch(filename);
  return await file.arrayBuffer();
}
