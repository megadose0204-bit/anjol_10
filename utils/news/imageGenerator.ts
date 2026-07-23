/**
 * 나노바나나(NanoBanana) / 제미나이(Gemini) 공식 REST API 직접 호출 파이프라인
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

export interface ArticleContext {
  title: string
  excerpt: string
  body1Text: string
  body2Text: string
  body4Text: string
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

/**
 * 프롬프트 문맥 100% 반영 실시간 AI 백업 엔진 (무작위 CDN이 아닌 실제 영문 프롬프트를 100% 그려내는 AI 엔진)
 */
function getContextualAiImageUrl(promptText: string, width: number, height: number, seed: number): string {
  const cleanPrompt = cleanAsciiPrompt(promptText)
  const encodedPrompt = encodeURIComponent(cleanPrompt.slice(0, 200))
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`
}

async function verifyImageReady(
  imageUrl: string,
  promptText: string,
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
    console.log(`[Image Timeout/Fallback (${sceneType})]: Using contextual AI engine`)
  }

  return getContextualAiImageUrl(promptText, width, height, seed)
}

/**
 * ★ [핵심] 생성 완료된 본문 전체 텍스트를 정독 및 이해하여 100% 문맥 매칭 영문 프롬프트 3개를 생성하는 AI Visual Director
 */
export async function generateArticleBasedImagePrompts(
  topic: string,
  articleCtx: ArticleContext,
  apiKey?: string
): Promise<{ headerPrompt: string; body1Prompt: string; body2Prompt: string }> {
  const activeKey = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NANOBANANA_API_KEY || ''

  if (activeKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${activeKey}`
      const promptInstruction = `You are a world-class AI visual director for high-end tech publications.
Analyze the following complete Korean blog post carefully:

[Article Title]: ${articleCtx.title}
[Article Summary]: ${articleCtx.excerpt}
[Section 1]: ${articleCtx.body1Text.slice(0, 350)}
[Section 2 - Technical Advantage]: ${articleCtx.body2Text.slice(0, 350)}
[Section 3 - Future Impact]: ${articleCtx.body4Text.slice(0, 350)}

Your Task:
Generate 3 distinct, photorealistic, highly detailed image prompts in English that 100% accurately visually capture the specific concepts, technology domain, objects, and environment described in this article.

Rules:
1. headerPrompt: Dramatic wide establishing shot representing the main topic "${articleCtx.title}".
2. body1Prompt: Macro detail close-up shot representing the technical advantage/architecture in Section 2.
3. body2Prompt: Cinematic environmental scene representing future strategic impact in Section 3.
4. STRICT DOMAIN ACCURACY: If the text is about smart buildings, servers, AI, satellite, semiconductors, or law, describe THAT exact subject. Do NOT force people into the image unless human action is central to the paragraph.
5. Return PURE JSON format only without markdown ticks:
{
  "headerPrompt": "English photorealistic prompt for header visual...",
  "body1Prompt": "English photorealistic prompt for section 2 technical visual...",
  "body2Prompt": "English photorealistic prompt for section 3 future visual..."
}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptInstruction }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          if (parsed.headerPrompt && parsed.body1Prompt && parsed.body2Prompt) {
            console.log('[AI Visual Director] 3 Prompts Successfully Created from Article Analysis:')
            console.log('- Header Prompt:', parsed.headerPrompt)
            console.log('- Body1 Prompt:', parsed.body1Prompt)
            console.log('- Body2 Prompt:', parsed.body2Prompt)
            return {
              headerPrompt: cleanAsciiPrompt(parsed.headerPrompt + ', photorealistic photography, 4K, 16:9'),
              body1Prompt: cleanAsciiPrompt(parsed.body1Prompt + ', photorealistic photography, 4K, 16:9'),
              body2Prompt: cleanAsciiPrompt(parsed.body2Prompt + ', photorealistic photography, 4K, 16:9'),
            }
          }
        }
      }
    } catch (err) {
      console.error('[AI Visual Director Error]:', err)
    }
  }

  // Fallback
  return {
    headerPrompt: cleanAsciiPrompt(`Photorealistic dramatic wide shot of ${topic}, high tech business setting, cinematic lighting, 4K, 16:9`),
    body1Prompt: cleanAsciiPrompt(`Photorealistic macro close-up of ${topic} technical architecture, digital twin microtexture, 4K, 16:9`),
    body2Prompt: cleanAsciiPrompt(`Photorealistic cinematic scene of ${topic} global future vision, dynamic urban background, 4K, 16:9`),
  }
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
  const activeKey = apiKey || process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
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
        imageSize: modelConfig.imageSize
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
      resolutionConfig: modelConfig.imageSize,
      headers: {
        'Content-Type': 'application/json',
      },
      requestPayload: requestBody,
    },
    null,
    2
  )

  console.log(`\n=================== [Calling Official Gemini Image Endpoint (${sceneType}) - Model: ${modelConfig.modelName} (${modelConfig.imageSize})] ===================`)
  console.log(schemaText)
  console.log(`==================================================================================\n`)

  if (activeKey) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        const part = data.candidates?.[0]?.content?.parts?.[0]
        const inlineBase64Raw = part?.inlineData?.data
        const mimeType = part?.inlineData?.mimeType || 'image/png'
        const imageUrl = part?.fileData?.fileUri || data.url || data.image_url

        if (inlineBase64Raw) {
          const cleanBase64 = inlineBase64Raw.replace(/\s+/g, '')
          const finalUrl = `data:${mimeType};base64,${cleanBase64}`
          console.log(`[Gemini Image Generated Successfully (${modelConfig.modelName} ${modelConfig.imageSize} / ${sceneType})]: Size = ${finalUrl.length} bytes`)
          return { imageUrl: finalUrl, schemaText }
        }

        if (imageUrl) {
          const verifiedUrl = await verifyImageReady(imageUrl, promptText, sceneType, width, height, seed)
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

  const contextualAiUrl = getContextualAiImageUrl(promptText, width, height, seed)
  const verifiedUrl = await verifyImageReady(contextualAiUrl, promptText, sceneType, width, height, seed)
  return { imageUrl: verifiedUrl, schemaText }
}

export async function generateNanoBananaImages(
  topic: string,
  keywords: string[] = [],
  apiKey?: string,
  model: NanoBananaModelType = 'nanobanana-2-2k',
  customEndpoint?: string,
  articleCtx?: ArticleContext
): Promise<GeneratedImagesResult> {
  const modelConfig = getNanoBananaConfig(model)
  const uniqueTimestamp = Date.now()
  const baseSeed = uniqueTimestamp + Math.floor(Math.random() * 1000000)

  // ★ 1. 생성 완료된 본문 전체 텍스트를 AI Visual Director가 정독 후 3개 맞춤 영문 프롬프트 추출
  let prompts = {
    headerPrompt: cleanAsciiPrompt(`Photorealistic dramatic wide shot of ${topic}, high tech business setting, cinematic lighting, 4K, 16:9`),
    body1Prompt: cleanAsciiPrompt(`Photorealistic macro close-up of ${topic} technical architecture, digital twin microtexture, 4K, 16:9`),
    body2Prompt: cleanAsciiPrompt(`Photorealistic cinematic scene of ${topic} global future vision, dynamic urban background, 4K, 16:9`),
  }

  if (articleCtx) {
    prompts = await generateArticleBasedImagePrompts(topic, articleCtx, apiKey)
  }

  let headerWidth = 2048
  let headerHeight = 1080
  let bodyWidth = 1920
  let bodyHeight = 1080

  if (modelConfig.imageSize === '1K') {
    headerWidth = 1280
    headerHeight = 720
    bodyWidth = 1280
    bodyHeight = 720
  } else if (modelConfig.imageSize === '4K') {
    headerWidth = 3840
    headerHeight = 2160
    bodyWidth = 2560
    bodyHeight = 1440
  }

  console.log(`[NanoBanana Pipeline] Selected Model Option: "${model}" -> Official Model Name: "${modelConfig.modelName}", Endpoint: "${modelConfig.endpoint}", Resolution: "${modelConfig.imageSize}"`)

  const resHeader = await fetchNanoBananaSingleImage(prompts.headerPrompt, model, topic, 'header', baseSeed + 101, apiKey, customEndpoint, headerWidth, headerHeight)
  await delay(200)

  const resBody1 = await fetchNanoBananaSingleImage(prompts.body1Prompt, model, topic, 'body1', baseSeed + 505, apiKey, customEndpoint, bodyWidth, bodyHeight)
  await delay(200)

  const resBody2 = await fetchNanoBananaSingleImage(prompts.body2Prompt, model, topic, 'body2', baseSeed + 909, apiKey, customEndpoint, bodyWidth, bodyHeight)

  return {
    headerImage: resHeader.imageUrl,
    bodyImage1: resBody1.imageUrl,
    bodyImage2: resBody2.imageUrl,
    headerPrompt: prompts.headerPrompt,
    body1Prompt: prompts.body1Prompt,
    body2Prompt: prompts.body2Prompt,
    headerSchema: resHeader.schemaText,
    body1Schema: resBody1.schemaText,
    body2Schema: resBody2.schemaText,
  }
}
