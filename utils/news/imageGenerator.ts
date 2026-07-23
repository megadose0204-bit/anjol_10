/**
 * 나노바나나(NanoBanana) / 제미나이(Gemini) REST API 직접 호출 파이프라인
 * 
 * 정식 generateContent 엔드포인트 & MAKE 규격 (inlineData.data 공백 제거) 이미지 추출
 */

import { getNanoBananaConfig } from './nanoBananaConfig'

export interface GeneratedImagesResult {
  headerImage: string
  bodyImage1: string
  bodyImage2: string
  headerPrompt: string
  body1Prompt: string
  body2Prompt: string
  headerSchema: string
  body1Schema: string
  body2Schema: string
}

export interface SingleImageFetchResult {
  imageUrl: string
  schemaText: string
}

export interface SectionTexts {
  headerText?: string
  body1Text?: string
  body2Text?: string
}

export type NanoBananaModelType = 'nanobanana' | 'nanobanana-2-2k' | 'nanobanana-2-4k' | 'nanobanana-2' | 'nanobanana-pro' | string

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function cleanAsciiPrompt(text: string): string {
  return text
    .replace(/[가-힣]/g, ' ')
    .replace(/[^a-zA-Z0-9\s,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getBackupMediaUrl(topic: string, sceneType: 'header' | 'body1' | 'body2', width: number, height: number, seed: number): string {
  const sceneTag = sceneType === 'header' ? 'hero,technology' : sceneType === 'body1' ? 'hardware,engineering' : 'city,future'
  return `https://loremflickr.com/g/${width}/${height}/${sceneTag}?lock=${seed}`
}

async function verifyImageReady(
  imageUrl: string,
  topic: string,
  sceneType: 'header' | 'body1' | 'body2',
  width: number,
  height: number,
  seed: number
): Promise<string> {
  if (imageUrl.startsWith('data:image')) {
    console.log(`[Base64 Inline Image Generated (${sceneType})]: Size = ${imageUrl.length} bytes`)
    return imageUrl
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3500)

  try {
    const res = await fetch(imageUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-100' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok || res.status === 206) {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('image') || res.status === 200 || res.status === 206) {
        console.log(`[Verified Image 200 OK (${sceneType})]: ${imageUrl.slice(0, 65)}...`)
        return imageUrl
      }
    }
  } catch {
    clearTimeout(timeoutId)
    console.log(`[Image Timeout/Fallback (${sceneType})]: Using dynamic seed backup CDN`)
  }

  return getBackupMediaUrl(topic, sceneType, width, height, seed)
}

async function generateEnglishPromptWithGemini(
  sectionText: string | undefined,
  defaultTopic: string,
  apiKey?: string
): Promise<string> {
  const textToAnalyze = (sectionText || defaultTopic || 'modern high tech business innovation').trim()
  const activeKey = apiKey || process.env.GEMINI_API_KEY || process.env.NANOBANANA_API_KEY || ''

  if (activeKey && textToAnalyze.length > 5) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`
      const promptInstruction = `You generate a single photorealistic image prompt in English from a given Korean article paragraph.
Read the Korean paragraph carefully and capture the primary visual subject, environment, equipment, action, and background described in the text.

Strict output rules:
- Output ONLY one English sentence describing a real-world photographic scene that directly matches the Korean paragraph.
- Do not include quotes, JSON, labels, bullet points, or code blocks.
- Do not include any Korean characters.
- Do not add any explanation or extra text.

Korean Article Paragraph:
${textToAnalyze}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptInstruction }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawResult = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawResult) {
          const cleanResult = cleanAsciiPrompt(rawResult)
          if (cleanResult.length > 10) {
            return cleanResult
          }
        }
      }
    } catch (err) {
      console.error('[Gemini Prompt Auto-generation Error]:', err)
    }
  }

  return fallbackEnglishSubject(textToAnalyze, defaultTopic)
}

function fallbackEnglishSubject(sectionText: string, defaultTopic: string): string {
  const text = (sectionText + ' ' + defaultTopic).toLowerCase()

  if (/k-food|k푸드|수출|식품|음식|요리|한식|식음료|라면|김치|농식품/i.test(text)) {
    if (/유럽|중동|해외|시장|글로벌|증가/i.test(text)) {
      return 'premium Korean gourmet export dishes, kimchi and authentic culinary cuisine served in an elegant international restaurant setting, chef presentation'
    }
    return 'authentic Korean food platter with rich colorful side dishes, high resolution culinary photography, natural lighting'
  }

  if (/위성|스타링크|저궤도|통신|안테나|네트워크|주파수/i.test(text)) {
    if (/장비|메커니즘|모듈|구조|기술|처리/i.test(text)) {
      return 'a close-up shot of a high-tech satellite communication transceiver antenna module with precision metallic microtexture and circuitry'
    }
    return 'a large satellite dish array receiving high-speed low-earth orbit data in a vast open landscape during twilight'
  }

  if (/ai|제미나이|인공지능|알파벳|구글|모델|클라우드|연산|빅데이터|소프트웨어/i.test(text)) {
    if (/메커니즘|성능|구조|비동기|우위|알고리즘/i.test(text)) {
      return 'a skilled software engineer analyzing artificial intelligence neural network data visualizations on glowing glass displays'
    }
    return 'sleek futuristic cloud data center server racks with ambient blue LED illumination and high-speed data flow'
  }

  if (/자동화|로봇|스마트|공장|물류|산업|제조/i.test(text)) {
    return 'advanced automated robotic industrial arms operating smoothly in a modern smart manufacturing facility'
  }

  if (/주식|시가총액|금리|경제|투자|금융|시장|상승/i.test(text)) {
    return 'a professional East Asian financial analyst reviewing real-time stock market data charts on multiple monitors in a modern office'
  }

  return 'a professional East Asian specialist working with advanced technology equipment in a modern realistic setting'
}

async function buildPhotorealisticPrompt(
  sectionText: string | undefined,
  topic: string,
  sceneType: 'header' | 'body1' | 'body2',
  uniqueTimestamp: number,
  apiKey?: string
): Promise<string> {
  const geminiEnglishSubject = await generateEnglishPromptWithGemini(sectionText, topic, apiKey)

  let sceneDetails = ''
  if (sceneType === 'header') {
    sceneDetails = `dramatic wide establishing shot of ${geminiEnglishSubject}, grand environmental perspective, emotional depth`
  } else if (sceneType === 'body1') {
    sceneDetails = `extreme macro detail close-up shot of ${geminiEnglishSubject}, tactile microtexture, intricate craftsmanship, focused expression`
  } else {
    sceneDetails = `cinematic wide environmental scene showcasing ${geminiEnglishSubject}, global city background, future strategic vision`
  }

  const fullPromptText = [
    `Photorealistic photograph of ${geminiEnglishSubject}`,
    sceneDetails,
    'realistic Korean or East Asian individual with detailed natural features, professional modern clothing',
    sceneType === 'header' ? 'golden hour sunlight, soft directional key at 45 degrees' : sceneType === 'body1' ? 'cool laboratory lighting, sharp key light with micro shadows' : 'blue hour ambient glow, cinematic rim lighting',
    'camera Sony A7R IV or Canon R5, lens 50mm prime, aperture f1.8 to f4, shutter 1/250, ISO 100, white balance 5200K, focus on main subject',
    'photorealistic, real-world photography, physically plausible lighting, true-to-life colors, natural film grain, realistic skin texture',
    'physically correct shadows, contact shadows, plausible reflections, real-world surface microtexture',
    'cinematic framing, rule of thirds, layered depth, 4K resolution, 16:9 aspect ratio',
    'no illustration, no painting, no vector, no cartoon, no anime, no 3D render, no CGI, no flat shading, no plastic skin, no watermark, no logo artifacts',
  ].join(', ')

  const cleanFullPrompt = cleanAsciiPrompt(fullPromptText)

  console.log(`\n=================== [Official Model Prompt Used: ${sceneType}] ===================`)
  console.log(cleanFullPrompt)
  console.log(`==================================================================================\n`)

  return cleanFullPrompt
}

async function fetchNanoBananaSingleImage(
  promptText: string,
  model: string,
  topic: string,
  sceneType: 'header' | 'body1' | 'body2',
  seed: number,
  apiKey?: string,
  customEndpoint?: string,
  width = 1200,
  height = 630
): Promise<SingleImageFetchResult> {
  const modelConfig = getNanoBananaConfig(model)
  const activeKey = apiKey || process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY || ''
  const baseEndpoint = customEndpoint || modelConfig.endpoint
  const targetUrl = activeKey ? `${baseEndpoint}?key=${activeKey}` : baseEndpoint

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: modelConfig.imageSize || '2K'
      },
      temperature: modelConfig.temperature || 0.7
    }
  }

  const schemaText = JSON.stringify(
    {
      targetUrl: targetUrl.replace(activeKey, activeKey ? 'PRESENT_API_KEY' : 'NO_KEY_PROVIDED'),
      httpMethod: 'POST',
      selectedModelType: model,
      officialModelName: modelConfig.modelName,
      headers: {
        'Content-Type': 'application/json',
      },
      requestPayload: requestBody,
    },
    null,
    2
  )

  console.log(`\n=================== [Calling Official Gemini Image Endpoint (${sceneType})] ===================`)
  console.log(schemaText)
  console.log(`==================================================================================\n`)

  if (activeKey) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        const part = data.candidates?.[0]?.content?.parts?.[0]
        const inlineBase64Raw = part?.inlineData?.data
        const mimeType = part?.inlineData?.mimeType || 'image/png'
        const imageUrl = part?.fileData?.fileUri || data.url || data.image_url

        if (inlineBase64Raw) {
          // MAKE 자동화 유틸리티 규격: inlineData.data 내 개행 및 공백(/\s+/g) 제거 후 청정 Base64 생성
          const cleanBase64 = inlineBase64Raw.replace(/\s+/g, '')
          const finalUrl = `data:${mimeType};base64,${cleanBase64}`
          return { imageUrl: finalUrl, schemaText }
        }

        if (imageUrl) {
          const verifiedUrl = await verifyImageReady(imageUrl, topic, sceneType, width, height, seed)
          return { imageUrl: verifiedUrl, schemaText }
        }
      } else {
        const errText = await response.text()
        console.error(`[Gemini Image API Status ${response.status} (${sceneType})]:`, errText.slice(0, 300))
      }
    } catch (error) {
      console.error(`[Gemini Image API Call Error (${sceneType})]:`, error)
    }
  }

  const verifiedUrl = await verifyImageReady(getBackupMediaUrl(topic, sceneType, width, height, seed), topic, sceneType, width, height, seed)
  return { imageUrl: verifiedUrl, schemaText }
}

export async function generateNanoBananaImages(
  topic: string,
  keywords: string[] = [],
  apiKey?: string,
  model: NanoBananaModelType = 'nanobanana-2-2k',
  customEndpoint?: string,
  sectionTexts?: SectionTexts
): Promise<GeneratedImagesResult> {
  const uniqueTimestamp = Date.now()
  const baseSeed = uniqueTimestamp + Math.floor(Math.random() * 1000000)

  const promptHeader = await buildPhotorealisticPrompt(sectionTexts?.headerText, topic, 'header', uniqueTimestamp, apiKey)
  const promptBody1 = await buildPhotorealisticPrompt(sectionTexts?.body1Text, topic, 'body1', uniqueTimestamp, apiKey)
  const promptBody2 = await buildPhotorealisticPrompt(sectionTexts?.body2Text, topic, 'body2', uniqueTimestamp, apiKey)

  let headerWidth = 2048
  let headerHeight = 1080
  let bodyWidth = 1920
  let bodyHeight = 1080

  if (model === 'nanobanana-2-4k' || model === 'nanobanana-pro') {
    headerWidth = 3840
    headerHeight = 2160
    bodyWidth = 2560
    bodyHeight = 1440
  }

  const resHeader = await fetchNanoBananaSingleImage(promptHeader, model, topic, 'header', baseSeed + 101, apiKey, customEndpoint, headerWidth, headerHeight)
  await delay(200)

  const resBody1 = await fetchNanoBananaSingleImage(promptBody1, model, topic, 'body1', baseSeed + 505, apiKey, customEndpoint, bodyWidth, bodyHeight)
  await delay(200)

  const resBody2 = await fetchNanoBananaSingleImage(promptBody2, model, topic, 'body2', baseSeed + 909, apiKey, customEndpoint, bodyWidth, bodyHeight)

  return {
    headerImage: resHeader.imageUrl,
    bodyImage1: resBody1.imageUrl,
    bodyImage2: resBody2.imageUrl,
    headerPrompt: promptHeader,
    body1Prompt: promptBody1,
    body2Prompt: promptBody2,
    headerSchema: resHeader.schemaText,
    body1Schema: resBody1.schemaText,
    body2Schema: resBody2.schemaText,
  }
}
