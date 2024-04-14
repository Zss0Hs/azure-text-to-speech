// 定义全局变量存储 access_token 和上次更新时间
let accessToken = '';
let lastTokenUpdateTime = 0;
let authenticationString = "kvzNEPnTfeKMZcdNgZnHHZvfAe"; // 默认的验证字符串
let region = 'eastus';

// 定义 API URL 和 Token URL
let apiUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
let tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

export default {
  async fetch(request, env, ctx) {

    // 输出环境变量对象以进行调试
    // console.log(env);

    //取环境变量ENV_AUTHORIZATION的值，或取默认值
    authenticationString = env.ENV_AUTHORIZATION || authenticationString;
     //取环境变量ENV_REGION的值，或取默认值
    region = env.ENV_REGION || region;

    // 定义 API URL 和 Token URL
    apiUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;  

    // 验证请求头中的验证字符串
    const authHeader = request.headers.get('Authorization');
    const effectiveAuthString = authHeader || authenticationString;
    if (effectiveAuthString !== authenticationString) {
      return new Response('Unauthorized', { status: 404 });
    }

    // 解析请求中的文本
    let text;
    try {
      text = await extractTextFromBody(request);
    } catch (error) {
      console.error('Failed to extract text from request body:', error);
      return new Response('Failed to extract text from request body. Please follow json format :{"text":"some texts"}', { status: 400 });
    }

    // 获取订阅密钥
    const subscriptionKey = request.headers.get('Subscription-Key') || env.ENV_SUBSCRIPTION_KEY;

    // 如果没有订阅密钥，则返回错误
    if (!subscriptionKey) {
      return new Response('Missing Subscription-Key header. Add subscription_key to the request header or set the Workers environment variable ENV_SUBSCRIPTION_KEY ', { status: 400 });
    }

    // 获取 access_token
    if (needsTokenRefresh()) {
      try {
        await refreshToken(subscriptionKey);
      } catch (error) {
        console.error('Failed to refresh access token:', error.message);
        return new Response('Failed to refresh access token. Check the Workers environment variable ENV_REGION', { status: 500 });
      }
    }

    // 将文本发送到转换 API 进行转换
    let audioResponse;
    try {
      audioResponse = await convertTextToSpeech(text);
    } catch (error) {
      console.error('Failed to convert text to speech:', error.message);
      return new Response('Failed to convert text to speech. Check the Workers environment variable ENV_REGION', { status: 500 });
    }

    // 将返回的音频文件返回给请求
    return new Response(audioResponse.body, {
      status: audioResponse.status,
      headers: {
        'Content-Type': audioResponse.headers.get('Content-Type')
      }
    });
  }
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
async function convertTextToSpeech(text) {
  const outputFormat = 'riff-24khz-16bit-mono-pcm';
  const voiceName = 'zh-CN-XiaoxiaoNeural';
  const style = 'gentle'; //'default'默认 'friendly'友好 'chat'聊天 'gentle'温柔
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
