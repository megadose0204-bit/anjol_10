import { CollectedNewsResult } from './collector'
import { mdLiteToHtml, estimateReadingMinutes, extractExcerpt, formatReadableParagraphs } from '@/utils/markdown'
import { generateNanoBananaImages } from './imageGenerator'

export interface AutoPostOptions {
  topic: string
  categorySlug?: string
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

function generateHashtags(topic: string, keywords: string[], parsedJson?: any): string {
  const candidateSet = new Set<string>()

  const topicWords = topic.replace(/[^\w\s가-힣]/g, ' ').split(/\s+/).filter((w) => w.length >= 2)
  topicWords.forEach((w) => candidateSet.add(w))

  if (keywords && keywords.length > 0) {
    keywords.forEach((k) => {
      const clean = k.replace(/[^\w가-힣]/g, '').trim()
      if (clean.length >= 2) candidateSet.add(clean)
    })
  }

  if (parsedJson) {
    ;['소제목 1', '소제목 2', '소제목 3', '소제목 4'].forEach((key) => {
      if (parsedJson[key]) {
        const words = parsedJson[key]
          .replace(/[^\w\s가-힣]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length >= 2 && !/^(완벽|가이드|분석|전망|소개|관련|핵심|장점|활용|파급|효과)$/.test(w))
        words.forEach((w: string) => candidateSet.add(w))
      }
    })
  }

  const defaultExts = ['시장전망', '기술혁신', '트렌드분석', '핵심요약', '비즈니스전략', '정책분석', '경제전망']
  defaultExts.forEach((e) => candidateSet.add(e))

  const tags = Array.from(candidateSet)
    .slice(0, 10)
    .map((t) => `#${t}`)
  return tags.join(' ')
}

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

  const toneRule = options.tone ? `- 글 분위기 (Tone): '${options.tone}' 어조와 문체로 작성하세요.` : ''
  const audienceRule = options.targetAudience ? `- 대상 독자 (Target Audience): '${options.targetAudience}' 독자층을 염두에 두고 맞춤형 용어와 어조로 작성하세요.` : ''
  const wordCountRule = options.wordCount ? `- 목표 단어 수 (Word Count): 약 ${options.wordCount}단어 (공백 제외 약 ${Math.round(options.wordCount * 3.5)}자 이상)로 풍부하게 작성하세요.` : ''
  const referenceRule = options.referenceUrls && options.referenceUrls.length > 0 ? `- 참고 URL: ${options.referenceUrls.join(', ')}` : ''
  const customRule = options.customInstructions ? `- 추가 필수 지시사항 (Custom Instructions): ${options.customInstructions} (★ 이 지침을 최우선으로 반영할 것)` : ''

  const prompt = `
당신은 대한민국 최고의 SEO 블로그 전문 에디터입니다.
구글과 네이버 검색엔진이 선호하는 고품질 SEO 맞춤 포스트를 지정된 JSON 형식으로 생성해 주세요.

[주제 및 키워드 정보]:
- 주제: ${options.topic}
- 메인 키워드: ${mainKeyword}
- 서브 키워드1: ${subKey1}
- 서브 키워드2: ${subKey2}
- 서브 키워드3: ${subKey3}

[24시간 실시간 뉴스 컨텍스트]:
${newsData.summaryPromptContext}

[사용자 세부 맞춤 옵션 지침]:
${toneRule}
${audienceRule}
${wordCountRule}
${referenceRule}
${customRule}

[★ 글쓰기 필수 요구 규칙]:
1. 제목: 매력적이고 SEO에 적합하며 관련 키워드가 자연스럽게 조합된 제목으로 작성하세요.
2. 소제목 및 문단 구성: { "제목", "요약글", "소제목 1", "소제목 2", "소제목 3", "문단 1", "문단 2", "문단 3" } 3개의 독립적인 소제목과 문단으로 구성하세요.
3. 태그 사용 필수 룰:
   - 각 문단의 소제목("소제목 1", "소제목 2", "소제목 3")은 마크다운 ## (<h2>) 태그로 표현됩니다.
   - 글 전체 내용 중 구체적 세부 설명 부분에 마크다운 ### (<h3>) 태그를 정확히 3번 사용하세요.
   - 글 전체 내용 중 리스트 또는 핵심 질문/답변 목록 부분에 마크다운 - (<li>) 태그를 2번 이상 사용하세요.
4. 분량 및 딥다이브 설명:
   - 각 문단("문단 1", "문단 2", "문단 3")은 구체적인 정보, 설명, 풍부한 예시를 포함하여 총 전체 글자 수가 공백 제외 2,000자 이상이 되도록 길고 풍부하게 작성하세요.
5. 가독성 및 톤앤매너:
   - 정보성 글을 작성하되, 사람들이 끝까지 읽기 편하도록 대학생 수준에서 편하게 읽을 수 있는 명확하고 친절한 어조로 작성하세요.
   - 구글 검색 사용자의 검색 의도를 고려하여 질의-답변(Q&A) 구조와 명쾌한 해결책을 제시하세요.
   - 2~3문장마다 줄바꿈(\n\n)을 넣어 가독성을 극대화하세요.

[필수 지침 - JSON 출력 구조]:
아래 8개 키를 포함하는 순수한 JSON 형식으로 출력하세요 (추가 설명/마크다운 백틱 없이 순수 JSON만 출력):
{
  "제목": "매력적이고 SEO에 최적화된 포스트 제목",
  "요약글": "핵심 내용을 요약한 2~3문장 서술",
  "소제목 1": "${subKey1} 관련 매력적인 1번 소제목",
  "소제목 2": "${subKey2} 관련 매력적인 2번 소제목",
  "소제목 3": "${subKey3} 관련 매력적인 3번 소제목",
  "문단 1": "소제목 1에 해당하는 구체적이고 풍부한 설명, 예시, H3 및 LI 태그 포함 문단 (2~3문장마다 \n\n 줄바꿈)",
  "문단 2": "소제목 2에 해당하는 구체적이고 풍부한 설명, 예시, H3 및 LI 태그 포함 문단 (2~3문장마다 \n\n 줄바꿈)",
  "문단 3": "소제목 3에 해당하는 구체적이고 풍부한 설명, 예시, H3 및 LI 태그 포함 문단 (2~3문장마다 \n\n 줄바꿈)"
}
`.trim()

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
        text = text.replace(/\u0060\u0060\u0060json/gi, '').replace(/\u0060\u0060\u0060/g, '').trim()
        const parsed = JSON.parse(text)

        const title = parsed['제목'] || `[SEO] ${options.topic} 완벽 가이드`
        const excerpt = parsed['요약글'] || `${options.topic}에 관한 심층 분석 리포트입니다.`

        const body1Text = formatReadableParagraphs(parsed['문단 1'] || parsed['1문단'] || '')
        const body2Text = formatReadableParagraphs(parsed['문단 2'] || parsed['2문단'] || '')
        const body3Text = formatReadableParagraphs(parsed['문단 3'] || parsed['3문단'] || '')

        const hashtags = generateHashtags(options.topic, keywordsList, parsed)

        // ★ [핵심] 생성된 3개 문단의 본문 내용을 정독하여 각각 100% 매칭되는 독창적 3개 영문 프롬프트 생성 후 이미지 매핑
        console.log('[AI Post Generator] Analyzing 3 paragraph contents to create 100% matching unique image prompts...')
        const images = await generateNanoBananaImages(
          options.topic,
          keywordsList,
          apiKey,
          options.imageModel,
          options.nanoBananaEndpoint,
          {
            title,
            excerpt,
            body1Text,
            body2Text,
            body4Text: body3Text,
          }
        )

        const contentMarkdown = `
> **요약**: ${excerpt}

## ${parsed['소제목 1'] || subKey1}

![${parsed['소제목 1'] || subKey1} 비주얼](${images.headerImage})

${body1Text}

## ${parsed['소제목 2'] || subKey2}

![${parsed['소제목 2'] || subKey2} 비주얼](${images.bodyImage1})

${body2Text}

## ${parsed['소제목 3'] || subKey3}

![${parsed['소제목 3'] || subKey3} 비주얼](${images.bodyImage2})

${body3Text}

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

${hashtags}

---

### 🎨 생성 이미지 AI 프롬프트 및 API 요청 스키마 (Prompts & API Schemas)

본 포스트의 3개 이미지 생성 시 나노바나나/제미나이 AI 엔진에 전달된 100% 문맥 일치 영문 실사 프롬프트 및 **실제 전송된 정식 API 요청 스키마 페이로드(Request Payload Schema)**입니다.

#### 1. 1번 문단 이미지 프롬프트 (Paragraph 1 Visual)
\`\`\`text
${images.headerPrompt || ''}
\`\`\`

> **⚙️ 1번 이미지 생성 시 전송된 API 요청 스키마 (Paragraph 1 Payload)**
\`\`\`json
${images.headerSchema || ''}
\`\`\`

#### 2. 2번 문단 이미지 프롬프트 (Paragraph 2 Visual)
\`\`\`text
${images.body1Prompt || ''}
\`\`\`

> **⚙️ 2번 이미지 생성 시 전송된 API 요청 스키마 (Paragraph 2 Payload)**
\`\`\`json
${images.body1Schema || ''}
\`\`\`

#### 3. 3번 문단 이미지 프롬프트 (Paragraph 3 Visual)
\`\`\`text
${images.body2Prompt || ''}
\`\`\`

> **⚙️ 3번 이미지 생성 시 전송된 API 요청 스키마 (Paragraph 3 Payload)**
\`\`\`json
${images.body2Schema || ''}
\`\`\`
`.trim()

        return { title, excerpt, contentMarkdown }
      }
    }
  } catch (e) {
    console.error('Failed to generate with Gemini:', e)
  }

  return null
}

export async function generateAutoPost(
  newsData: CollectedNewsResult,
  options: AutoPostOptions
): Promise<GeneratedPostResult> {
  let postData: { title: string; excerpt: string; contentMarkdown: string } | null = null

  const activeApiKey =
    options.nanoBananaApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NANOBANANA_API_KEY ||
    ''

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

    const hashtags = generateHashtags(options.topic, keywordsList)

    const newsSummaryText = newsData.articles.slice(0, 4).map((a) => `- ${a.title} (${a.source})`).join('\n')
    const sec1Text = `최근 24시간 동안 ${options.topic} 분야는 뜨거운 관심을 받고 있습니다.\n\n주요 뉴스 요약:\n${newsSummaryText}`
    const sec2Text = `${mainKeyword}의 핵심 우위는 탁월한 효율성과 혁신적인 스마트 기술 접근 방식에 있습니다. ${subKey2} 관련 기술적 차별성과 고성능 인프라가 적용됩니다.`
    const sec4Text = `앞으로 ${options.topic} 관련 생태계 및 ${subKey4} 파급 효과는 글로벌 시장에서 더욱 급격하게 성장할 것으로 예상됩니다.`

    const images = await generateNanoBananaImages(
      options.topic,
      keywordsList,
      activeApiKey,
      options.imageModel,
      options.nanoBananaEndpoint,
      {
        title,
        excerpt,
        body1Text: sec1Text,
        body2Text: sec2Text,
        body4Text: sec4Text,
      }
    )

    const contentMarkdown = `
> **요약**: ${excerpt}

![${shortTopic} 대표 비주얼](${images.headerImage})

## 1. 24시간 실시간 뉴스 핵심 쟁점 및 ${subKey1}

${sec1Text}

${options.customInstructions ? `\n> **추가 지시 반영**: ${options.customInstructions}\n` : ''}

## 2. ${subKey2} 및 기술적 차별성

![${subKey2} 구조 인포그래픽](${images.bodyImage1})

${sec2Text}

${options.referenceUrls && options.referenceUrls.length > 0 ? `\n### 참고 자료:\n${options.referenceUrls.map((url) => `- [참고 링크](${url})`).join('\n')}\n` : ''}

## 3. ${subKey3} 및 실전 비즈니스 전략

기술의 발전 속도에 맞춰 **${subKey3}**을 적시에 도입하는 것이 중요합니다.

## 4. ${subKey4} 및 미래 전망

![${subKey4} 미래 비주얼](${images.bodyImage2})

${sec4Text}

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

${hashtags}

---

### 🎨 생성 이미지 AI 프롬프트 및 API 요청 스키마 (Prompts & API Schemas)

본 포스트의 3개 이미지 생성 시 나노바나나/제미나이 AI 엔진에 전달된 100% 문맥 일치 영문 실사 프롬프트 및 **실제 전송된 정식 API 요청 스키마 페이로드(Request Payload Schema)**입니다.

#### 1. 대표 썸네일 이미지 프롬프트 (Header Visual)
\u0060\u0060\u0060text
${images.headerPrompt || ''}
\u0060\u0060\u0060

> **⚙️ 1번 이미지 생성 시 전송된 API 요청 스키마 (Header Schema Payload)**
\u0060\u0060\u0060json
${images.headerSchema || ''}
\u0060\u0060\u0060

#### 2. 기술 메커니즘 이미지 프롬프트 (Section 2 Visual)
\u0060\u0060\u0060text
${images.body1Prompt || ''}
\u0060\u0060\u0060

> **⚙️ 2번 이미지 생성 시 전송된 API 요청 스키마 (Section 2 Schema Payload)**
\u0060\u0060\u0060json
${images.body1Schema || ''}
\u0060\u0060\u0060

#### 3. 미래 파급력 이미지 프롬프트 (Section 3 Visual)
\u0060\u0060\u0060text
${images.body2Prompt || ''}
\u0060\u0060\u0060

> **⚙️ 3번 이미지 생성 시 전송된 API 요청 스키마 (Section 3 Schema Payload)**
\u0060\u0060\u0060json
${images.body2Schema || ''}
\u0060\u0060\u0060
`.trim()

    postData = { title, excerpt, contentMarkdown }
  }

  const contentHtml = mdLiteToHtml(postData.contentMarkdown)
  const readingMinutes = estimateReadingMinutes(postData.contentMarkdown)
  const categorySlug = options.categorySlug || inferCategorySlug(options.topic, newsData.topKeywords)

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

export const generateSeoPost = generateAutoPost;

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

function extractShortTopicName(topic: string): string {
  if (!topic) return 'IT 이슈'
  const cleaned = topic.replace(/\([^)]*\)/g, '').trim()
  const words = cleaned.split(/\s+/)
  if (words.length > 0 && words[0].length >= 2) {
    return words[0]
  }
  return cleaned || 'IT 이슈'
}
