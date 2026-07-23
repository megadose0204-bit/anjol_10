import { CollectedNewsResult } from './collector'
import { mdLiteToHtml, estimateReadingMinutes, extractExcerpt } from '@/utils/markdown'
import { generateNanoBananaImages } from './imageGenerator'

export interface AutoPostOptions {
  topic: string
  tone?: string
  targetAudience?: string
  wordCount?: number
  keywords?: string[]
  referenceUrls?: string[]
  customInstructions?: string
  nanoBananaApiKey?: string
  nanoBananaEndpoint?: string
  imageModel?: string
  cta?: {
    text: string
    url: string
  }
}

export interface GeneratedPostResult {
  title: string
  excerpt: string
  contentMarkdown: string
  contentHtml: string
  readingMinutes: number
  categorySlug: string
  topKeywords: string[]
}

/**
 * Gemini API를 이용한 맞춤 옵션 반영 SEO 포스트 생성 (나노바나나 AI 이미지 통합)
 */
async function generateWithGemini(
  newsData: CollectedNewsResult,
  options: AutoPostOptions,
  apiKey: string
): Promise<{ title: string; excerpt: string; contentMarkdown: string } | null> {
  const keywordsList = options.keywords && options.keywords.length > 0
    ? options.keywords.slice(0, 5)
    : newsData.topKeywords.slice(0, 5)

  const mainKeyword = keywordsList[0] || options.topic
  const subKey1 = keywordsList[1] || `${options.topic} 트렌드`
  const subKey2 = keywordsList[2] || `${options.topic} 핵심 장점`
  const subKey3 = keywordsList[3] || `${options.topic} 실전 활용`
  const subKey4 = keywordsList[4] || `${options.topic} 파급 효과`

  // 1. 세부 옵션 지침 구성
  const toneRule = options.tone ? `- 글 분위기 (Tone): '${options.tone}' 어조와 문체로 작성하세요.` : ''
  const audienceRule = options.targetAudience ? `- 대상 독자 (Target Audience): '${options.targetAudience}' 독자층을 염두에 두고 맞춤형 용어와 어조로 작성하세요.` : ''
  const wordCountRule = options.wordCount ? `- 목표 단어 수 (Word Count): 약 ${options.wordCount}단어 (공백 제외 약 ${options.wordCount * 3.5}자 이상)로 풍부하게 서술하세요.` : ''
  const referenceRule = options.referenceUrls && options.referenceUrls.length > 0
    ? `- 참고 웹페이지 링크:\n  ${options.referenceUrls.join('\n  ')}\n  위 참고 URL들의 핵심 인사이트 및 주요 정보를 본문 분석에 충실히 반영하세요.`
    : ''
  const customRule = options.customInstructions ? `- 추가 필수 지시사항 (Custom Instructions): ${options.customInstructions} (★ 이 지침을 최우선으로 반영할 것)` : ''

  const prompt = `
당신은 대한민국 최고의 SEO 블로그 전문 에디터입니다.
구글과 네이버 검색엔진이 선호하는 고품질 SEO 맞춤 포스트를 지정된 JSON 형식으로 생성해 주세요.

[메인 및 서브 키워드 정보]:
- 메인 키워드: ${mainKeyword}
- 서브 키워드1: ${subKey1}
- 서브 키워드2: ${subKey2}
- 서브 키워드3: ${subKey3}
- 서브 키워드4: ${subKey4}

[24시간 실시간 뉴스 컨텍스트]:
${newsData.summaryPromptContext}

[사용자 세부 맞춤 옵션 지침]:
${toneRule}
${audienceRule}
${wordCountRule}
${referenceRule}
${customRule}

[필수 지침 - JSON 출력 구조]:
아래 11개 키를 포함하는 순수한 JSON 형식으로 출력하세요 (추가 설명/마크다운 백틱 없이 순수 JSON만 출력):
{
  "제목": "매력적이고 SEO에 최적화된 포스트 제목 1개",
  "요약글": "핵심 내용을 요약한 2~3문장 서술",
  "소제목 1": "${subKey1} 관련 매력적인 소제목",
  "소제목 2": "${subKey2} 관련 매력적인 소제목",
  "소제목 3": "${subKey3} 관련 매력적인 소제목",
  "소제목 4": "${subKey4} 관련 매력적인 소제목",
  "1문단": "소제목1 관련 딥다이브 분석, 배경, 구체적 예시, 시사점 포함",
  "2문단": "소제목2 관련 딥다이브 분석, 기술적 비교, 실전 장점 포함",
  "3문단": "소제목3 관련 딥다이브 분석, 활용 사례, 비즈니스 가치 포함",
  "4문단": "소제목4 관련 딥다이브 분석, 시장 영향력, 독자 실행 가이드 포함",
  "종합 및 의견": "전체 내용을 종합 정리하고 향후 전망 및 전문가 의견 제시"
}
`.trim()

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (res.ok) {
      const data = await res.json()
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(text)

        const title = parsed['제목'] || `[SEO] ${options.topic} 완벽 가이드`
        const excerpt = parsed['요약글'] || `${options.topic}에 관한 심층 분석 리포트입니다.`

        const body1Text = parsed['1문단'] || ''
        const body2Text = parsed['2문단'] || ''
        const body3Text = parsed['3문단'] || ''

        // 2. 본문 문단 작성이 완료된 후 문맥 100% 매칭 나노바나나 AI 이미지 생성
        const images = await generateNanoBananaImages(
          options.topic,
          keywordsList,
          options.nanoBananaApiKey,
          options.imageModel,
          options.nanoBananaEndpoint,
          {
            headerText: body1Text,
            body1Text: body2Text,
            body2Text: body3Text,
          }
        )

        const contentMarkdown = `
> **요약**: ${excerpt}

![${options.topic} 대표 이미지](${images.headerImage})

## ${parsed['소제목 1']}

${parsed['1문단']}

## ${parsed['소제목 2']}

![${parsed['소제목 2']} 상세 이미지](${images.bodyImage1})

${parsed['2문단']}

## ${parsed['소제목 3']}

${parsed['3문단']}

## ${parsed['소제목 4']}

![${parsed['소제목 4']} 기술 전망 이미지](${images.bodyImage2})

${parsed['4문단']}

## 종합 및 시사점

${parsed['종합 및 의견']}

${
  options.cta?.text && options.cta?.url
    ? `
---

> ### 📢 ${options.cta.text}
> 
> 지금 바로 확인해 보세요: [👉 ${options.cta.text} 바로가기](${options.cta.url})
`
    : ''
}

---

### 🎨 생성 이미지 AI 프롬프트 및 API 요청 스키마 (Prompts & API Schemas)

본 포스트의 3개 이미지 생성 시 나노바나나/제미나이 AI 엔진에 전달된 100% 문맥 일치 영문 실사 프롬프트 및 **실제 전송된 정식 API 요청 스키마 페이로드(Request Payload Schema)**입니다.

#### 1. 대표 썸네일 이미지 프롬프트 (Header Visual)
\`\`\`text
${images.headerPrompt || ''}
\`\`\`

> **⚙️ 1번 이미지 생성 시 전송된 API 요청 스키마 (Header Schema Payload)**
\`\`\`json
${images.headerSchema || ''}
\`\`\`

#### 2. 기술 메커니즘 이미지 프롬프트 (Section 2 Visual)
\`\`\`text
${images.body1Prompt || ''}
\`\`\`

> **⚙️ 2번 이미지 생성 시 전송된 API 요청 스키마 (Section 2 Schema Payload)**
\`\`\`json
${images.body1Schema || ''}
\`\`\`

#### 3. 미래 파급력 이미지 프롬프트 (Section 3 Visual)
\`\`\`text
${images.body2Prompt || ''}
\`\`\`

> **⚙️ 3번 이미지 생성 시 전송된 API 요청 스키마 (Section 3 Schema Payload)**
\`\`\`json
${images.body2Schema || ''}
\`\`\`
`.trim()

        return { title, excerpt, contentMarkdown }
      }
    }
  } catch (error) {
    console.error('Gemini API Make-prompt generation error:', error)
  }

  return null
}

function cleanNounPhrase(str: string, fallback: string): string {
  if (!str || typeof str !== 'string') return fallback
  let clean = str.replace(/^(웃고|울상|해외서|국내서|밝혀|전해|이어|따르면|말해|넘어)$/gi, '').trim()
  if (!clean || clean.length < 2) return fallback
  if (clean.length > 20) {
    const words = clean
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !/^(들어갔다|기대되고|있다|초읽기에|서비스가|분석|대비|위해|통해)$/.test(w))
    clean = words.slice(0, 3).join(' ')
  }
  return clean || fallback
}

function extractShortTopicName(fullTopic: string): string {
  if (!fullTopic) return '기술 혁신 이슈'
  const clean = fullTopic.replace(/[^\w\s가-힣]/g, ' ').trim()
  const words = clean.split(/\s+/).filter((w) => w.length >= 2 && !/^(있다|있으며|받고|상승했다|의미한다|들어갔다|기대되고|분석|포스트|관련|서비스가|초읽기에)$/.test(w))
  if (words.length >= 2) {
    return words.slice(0, 3).join(' ')
  }
  return clean.slice(0, 20) || '기술 혁신 이슈'
}

export async function generateSeoPost(
  newsData: CollectedNewsResult,
  options: AutoPostOptions
): Promise<GeneratedPostResult> {
  const activeApiKey = options.nanoBananaApiKey || process.env.GEMINI_API_KEY || ''

  let postData: { title: string; excerpt: string; contentMarkdown: string } | null = null

  if (activeApiKey) {
    postData = await generateWithGemini(newsData, options, activeApiKey)
  }

  if (!postData) {
    const shortTopic = extractShortTopicName(options.topic)
    const keywordsList = options.keywords && options.keywords.length > 0
      ? options.keywords.slice(0, 5)
      : newsData.topKeywords.slice(0, 5)

    const mainKeyword = keywordsList[0] || shortTopic
    const subKey1 = keywordsList[1] || `${shortTopic} 트렌드`
    const subKey2 = keywordsList[2] || `${shortTopic} 핵심 장점`
    const subKey3 = keywordsList[3] || `${shortTopic} 실전 활용`
    const subKey4 = keywordsList[4] || `${shortTopic} 파급 효과`

    const titlePrefix = options.tone ? `[${options.tone}] ` : ''
    const title = `${titlePrefix}${options.topic}: ${mainKeyword} 완벽 가이드 및 24h 심층 분석`
    const excerpt = options.targetAudience
      ? `'${options.targetAudience}' 독자층을 위해 ${options.topic} 이슈를 24시간 분석한 맞춤 리포트입니다.`
      : `${options.topic} 이슈의 최근 24시간 실시간 트렌드 분석과 깊이 있는 정보를 제공하는 전문 SEO 포스트입니다.`

    const images = await generateNanoBananaImages(
      options.topic,
      keywordsList,
      options.nanoBananaApiKey,
      options.imageModel,
      options.nanoBananaEndpoint
    )

    const contentMarkdown = `
> **요약**: ${excerpt}

![${shortTopic} 대표 비주얼](${images.headerImage})

## 1. 24시간 실시간 뉴스 핵심 쟁점 및 ${subKey1}

최근 24시간 동안 **${options.topic}** 분야는 뜨거운 관심을 받고 있습니다.

### 주요 뉴스 요약:
${newsData.articles.slice(0, 4).map((a) => `- [${a.title}](${a.link}) (${a.source})`).join('\n')}

${options.customInstructions ? `\n> **추가 지시 반영**: ${options.customInstructions}\n` : ''}

## 2. ${subKey2} 및 기술적 차별성

![${subKey2} 구조 인포그래픽](${images.bodyImage1})

**${mainKeyword}**의 핵심 우위는 탁월한 효율성과 혁신적인 접근 방식에 있습니다.

${options.referenceUrls && options.referenceUrls.length > 0 ? `\n### 참고 자료:\n${options.referenceUrls.map((url) => `- [참고 링크](${url})`).join('\n')}\n` : ''}

## 3. ${subKey3} 및 실전 비즈니스 전략

기술의 발전 속도에 맞춰 **${subKey3}**을 적시에 도입하는 것이 중요합니다.

## 4. ${subKey4} 및 미래 전망

![${subKey4} 미래 비주얼](${images.bodyImage2})

앞으로 **${options.topic}** 관련 생태계는 더욱 급격하게 성장할 것으로 예상됩니다.

## 5. 결론 및 전문가 제언

종합적으로 볼 때 **${mainKeyword}** 이슈는 지속적으로 주목해야 할 핵심 과제입니다.

${
  options.cta?.text && options.cta?.url
    ? `
---

> ### 📢 ${options.cta.text}
> 
> 지금 바로 확인해 보세요: [👉 ${options.cta.text} 바로가기](${options.cta.url})
`
    : ''
}

---

### 🎨 생성 이미지 AI 프롬프트 및 API 요청 스키마 (Prompts & API Schemas)

본 포스트의 3개 이미지 생성 시 나노바나나/제미나이 AI 엔진에 전달된 100% 문맥 일치 영문 실사 프롬프트 및 **실제 전송된 정식 API 요청 스키마 페이로드(Request Payload Schema)**입니다.

#### 1. 대표 썸네일 이미지 프롬프트 (Header Visual)
\`\`\`text
${images.headerPrompt || ''}
\`\`\`

> **⚙️ 1번 이미지 생성 시 전송된 API 요청 스키마 (Header Schema Payload)**
\`\`\`json
${images.headerSchema || ''}
\`\`\`

#### 2. 기술 메커니즘 이미지 프롬프트 (Section 2 Visual)
\`\`\`text
${images.body1Prompt || ''}
\`\`\`

> **⚙️ 2번 이미지 생성 시 전송된 API 요청 스키마 (Section 2 Schema Payload)**
\`\`\`json
${images.body1Schema || ''}
\`\`\`

#### 3. 미래 파급력 이미지 프롬프트 (Section 3 Visual)
\`\`\`text
${images.body2Prompt || ''}
\`\`\`

> **⚙️ 3번 이미지 생성 시 전송된 API 요청 스키마 (Section 3 Schema Payload)**
\`\`\`json
${images.body2Schema || ''}
\`\`\`
`.trim()

    postData = { title, excerpt, contentMarkdown }
  }

  const contentHtml = mdLiteToHtml(postData.contentMarkdown)
  const readingMinutes = estimateReadingMinutes(postData.contentMarkdown)
  const categorySlug = inferCategorySlug(options.topic, newsData.topKeywords)

  return {
    title: postData.title,
    excerpt: postData.excerpt,
    contentMarkdown: postData.contentMarkdown,
    contentHtml,
    readingMinutes,
    categorySlug,
    topKeywords: newsData.topKeywords,
  }
}

function inferCategorySlug(topic: string, keywords: string[]): string {
  const topicLower = (topic + ' ' + keywords.join(' ')).toLowerCase()

  if (/react|next\.js|frontend|프론트/i.test(topicLower)) return 'react'
  if (/rust|wasm/i.test(topicLower)) return 'rust'
  if (/devops|ci\/cd|pipeline|인프라/i.test(topicLower)) return 'devops'
  if (/k8s|kubernetes|쿠버네티스/i.test(topicLower)) return 'kubernetes'
  if (/typescript|타입스크립트/i.test(topicLower)) return 'typescript'
  if (/javascript|자바스크립트/i.test(topicLower)) return 'javascript'
  if (/go|golang/i.test(topicLower)) return 'go'
  if (/docker|도커/i.test(topicLower)) return 'docker'
  if (/database|db|sql|postgresql|supabase/i.test(topicLower)) return 'database'
  if (/security|보안|인증|auth/i.test(topicLower)) return 'security'
  if (/performance|성능|최적화/i.test(topicLower)) return 'performance'

  return 'architecture'
}
