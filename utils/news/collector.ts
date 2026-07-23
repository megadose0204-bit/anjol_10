export interface NewsArticle {
  title: string
  link: string
  pubDate: string
  source: string
  snippet: string
  hoursAgo: number
}

export interface IssueSignalScore {
  trendScore: number
  exposureScore: number
  socialMentionScore: number
  impactScore: number
  totalScore: number
}

export interface CollectedNewsResult {
  topic: string
  articles: NewsArticle[]
  topKeywords: string[]
  signals: IssueSignalScore
  summaryPromptContext: string
}

/**
 * HTML 태그 및 엔티티 제거 정제 함수
 */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // HTML 태그 제거
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '') // 이차 태그 제거
    .replace(/\s+/g, ' ')
    .trim()
}

function parseRssXml(xmlText: string): NewsArticle[] {
  const articles: NewsArticle[] = []
  const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || []
  const now = new Date()

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i)
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i)
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)
    const sourceMatch = itemXml.match(/<source[\s\S]*?>([\s\S]*?)<\/source>/i)
    const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i)

    if (!titleMatch) continue

    let rawTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
    let rawLink = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ''
    let pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : ''
    let rawSource = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ''
    let rawSnippet = descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ''

    // clean HTML
    let title = cleanHtml(rawTitle)
    let source = cleanHtml(rawSource)
    let snippet = cleanHtml(rawSnippet)

    // 언론사 분리 (구글 뉴스 제목 형식: "기사 제목 - 언론사명")
    if (!source && title.includes(' - ')) {
      const parts = title.split(' - ')
      source = parts.pop() || ''
      title = parts.join(' - ')
    }

    const articleDate = pubDateStr ? new Date(pubDateStr) : now
    const diffMs = now.getTime() - articleDate.getTime()
    const hoursAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))

    if (hoursAgo <= 26) {
      articles.push({
        title,
        link: rawLink,
        pubDate: pubDateStr || articleDate.toISOString(),
        source: source || '주요 언론사',
        snippet: snippet.slice(0, 300),
        hoursAgo,
      })
    }
  }

  return articles
}

function analyzeSignals(articles: NewsArticle[]): { signals: IssueSignalScore; topKeywords: string[] } {
  if (articles.length === 0) {
    return {
      signals: { trendScore: 50, exposureScore: 50, socialMentionScore: 50, impactScore: 50, totalScore: 50 },
      topKeywords: [],
    }
  }

  const wordCounts = new Map<string, number>()
  const ignoreWords = new Set([
    '이유', '속보', '관련', '대표', '주요', '최근', '올해', '지난', '대한', '통해', '위해', '기자', '뉴스',
    '웃고', '울상', '해외서', '국내서', '해외', '국내', '식음료', '반사이익', '밝혀', '전해', '이어', '따르면', '넘어', '말해', '분석', '대비',
    '있어', '하고', '되어', '있는', '에서', '으로', '까지', '부터', '라는', '하며', '에게', '하여', '기대', '전망',
    'lt', 'gt', 'amp', 'nbsp', 'href', 'https', 'http', 'com', 'org', 'quot', 'font', 'target', 'blank', 'color', 'articles'
  ])

  const sanitizeWord = (word: string): string => {
    let clean = word.trim()
    // 동사 어미 / 조사 꼬리 자르기
    clean = clean.replace(/(서|고|며|가|이|을|를|에|의|로|으로|에서|까지|부터|다|며)$/g, '')
    return clean
  }

  for (const article of articles) {
    const cleanText = cleanHtml(article.title + ' ' + article.snippet)
    const words = cleanText
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .map(sanitizeWord)
      .filter((w) => w.length >= 2 && !ignoreWords.has(w.toLowerCase()) && !/^(웃고|울상|해외서|국내서|해외|국내|식음료|밝혀|전해|이어|따르면)$/.test(w))

    for (const w of words) {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1)
    }
  }

  const sortedKeywords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w)

  const exposureScore = Math.min(100, Math.max(40, articles.length * 8))
  const recentArticles = articles.filter((a) => a.hoursAgo <= 6)
  const trendScore = Math.min(100, Math.max(50, Math.round((recentArticles.length / (articles.length || 1)) * 100) + 20))
  const sources = new Set(articles.map((a) => a.source))
  const socialMentionScore = Math.min(100, Math.max(50, sources.size * 12 + 30))

  const impactKeywords = ['정부', '정책', '시장', '글로벌', '경제', '금리', 'AI', '기술', '안보', '발표', '급등', '기업', '투자', '산업', '자동화']
  let impactCount = 0
  for (const a of articles) {
    if (impactKeywords.some((kw) => a.title.includes(kw) || a.snippet.includes(kw))) {
      impactCount++
    }
  }
  const impactScore = Math.min(100, Math.max(60, Math.round((impactCount / (articles.length || 1)) * 100) + 30))
  const totalScore = Math.round((trendScore + exposureScore + socialMentionScore + impactScore) / 4)

  return {
    signals: {
      trendScore,
      exposureScore,
      socialMentionScore,
      impactScore,
      totalScore,
    },
    topKeywords: sortedKeywords,
  }
}

export async function collect24HourNews(topic: string): Promise<CollectedNewsResult> {
  const encodedTopic = encodeURIComponent(topic)
  const googleNewsRssUrl = `https://news.google.com/rss/search?q=${encodedTopic}&hl=ko&gl=KR&ceid=KR:ko`

  let articles: NewsArticle[] = []

  try {
    const response = await fetch(googleNewsRssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 0 },
    })

    if (response.ok) {
      const xmlText = await response.text()
      articles = parseRssXml(xmlText)
    }
  } catch (error) {
    console.error('Failed to fetch Google News RSS:', error)
  }

  if (articles.length < 3) {
    try {
      const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic + ' 이슈')}&hl=ko&gl=KR&ceid=KR:ko`
      const res = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (res.ok) {
        const fallbackXml = await res.text()
        const fallbackArticles = parseRssXml(fallbackXml)
        articles = [...articles, ...fallbackArticles]
      }
    } catch {
      // 무시
    }
  }

  const uniqueArticlesMap = new Map<string, NewsArticle>()
  for (const a of articles) {
    if (!uniqueArticlesMap.has(a.title)) {
      uniqueArticlesMap.set(a.title, a)
    }
  }
  const finalArticles = Array.from(uniqueArticlesMap.values()).slice(0, 10)
  const { signals, topKeywords } = analyzeSignals(finalArticles)

  const summaryPromptContext = finalArticles
    .map((a, i) => `기사 ${i + 1} [${a.source} / ${a.hoursAgo}시간 전]: ${a.title}\n요약: ${a.snippet}\n원문링크: ${a.link}`)
    .join('\n\n')

  return {
    topic,
    articles: finalArticles,
    topKeywords,
    signals,
    summaryPromptContext,
  }
}
