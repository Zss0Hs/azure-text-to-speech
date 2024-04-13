// 定义全局变量存储 access_token 和上次更新时间
let accessToken = '';
let lastTokenUpdateTime = 0;
const authenticationString = "kvzNEPnTfeKMZcdNgZnHHZvfAe";

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 验证请求头中的验证字符串
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== authenticationString) {
    return new Response('Unauthorized', { status: 404 });
  }

  // 解析请求中的文本
  let text;
  try {
    text = await extractTextFromBody(request);
  } catch (error) {
    console.error('Failed to extract text from request body:', error);
    return new Response('Failed to extract text from request body', { status: 400 });
  }

  // 获取订阅密钥
  const subscriptionKey = request.headers.get('Subscription-Key');

  // 获取 access_token
  if (needsTokenRefresh()) {
    await refreshToken(subscriptionKey);
  }

  // 将文本发送到转换 API 进行转换
  const audioResponse = await convertTextToSpeech(text, subscriptionKey);

  // 将返回的音频文件返回给请求
  return new Response(audioResponse.body, {
    status: audioResponse.status,
    headers: {
      'Content-Type': audioResponse.headers.get('Content-Type')
    }
  });
}

// 从请求体中提取文本
async function extractTextFromBody(request) {
  // 从请求体中提取文本
  const bodyText = await request.text();

  // 检查请求体是否为空
  if (!bodyText) {
    throw new Error('Request body is empty');
  }

  // 根据请求体的 Content-Type 处理不同的解析方法
  const contentType = request.headers.get('content-type');
  if (contentType.includes('application/json')) {
    // 如果是 JSON 格式，解析 JSON 并获取文本内容
    const jsonData = JSON.parse(bodyText);
    return jsonData.text;
  } else {
    // 否则直接返回文本内容
    return bodyText;
  }
}

// 检查是否需要更新 access_token
function needsTokenRefresh() {
  const currentTime = Date.now();
  const tokenExpirationTime = lastTokenUpdateTime + 9 * 60 * 1000; // 上次更新时间 + 9 分钟
  return currentTime > tokenExpirationTime;
}

// 获取新的 access_token
async function refreshToken(subscriptionKey) {
  const tokenUrl = 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
      'Ocp-Apim-Subscription-Key': subscriptionKey
    },
    body: ''
  });

  if (response.ok) {
    accessToken = await response.text();
    lastTokenUpdateTime = Date.now();
  } else {
    // 处理获取 token 失败的情况
    console.error('Failed to refresh access token');
    throw new Error('Failed to refresh access token');
  }
}

// 将文本发送到转换 API 进行转换
async function convertTextToSpeech(text, subscriptionKey) {
  const apiUrl = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
  const outputFormat = 'riff-24khz-16bit-mono-pcm';
  const voiceName = 'zh-CN-XiaoxiaoNeural';
  const style = 'gentle';  //'default'默认 'friendly'友好 'chat'聊天 'gentle'温柔
  const ssml = `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' style='${style}' name='${voiceName}'>${text}</voice></speak>`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': outputFormat,
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'jzTyPGyLbvpKZsaNDV'
    },
    body: ssml
  });

  if (!response.ok) {
    // 处理转换失败的情况
    console.error('Failed to convert text to speech');
    throw new Error('Failed to convert text to speech');
  }

  return response;
}
