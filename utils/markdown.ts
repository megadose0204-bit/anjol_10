/**
 * 마크다운 서브셋 → 안전한 HTML 변환 유틸리티 (Regex-Free Slicing 기반 콜스택 오버플로우 0% 탑재)
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('data:image/')) {
    return trimmed
  }
  return null
}

function extractAndProtectDataImages(text: string): { safeText: string; dataUrlStore: string[] } {
  const dataUrlStore: string[] = []
  let safeText = text
  let pos = 0

  // 정식 정규식을 절대 사용하지 않고 indexOf 인덱스 탐색만으로 대용량 Base64 이미지 URL 분리
  while (pos < safeText.length) {
    const dataIdx = safeText.indexOf('data:image/', pos)
    if (dataIdx === -1) break

    const imgStart = safeText.lastIndexOf('![', dataIdx)
    const openParen = safeText.lastIndexOf('(', dataIdx)

    if (imgStart !== -1 && openParen !== -1 && openParen > imgStart && openParen < dataIdx) {
      const closeParen = safeText.indexOf(')', dataIdx)
      if (closeParen !== -1) {
        const alt = safeText.slice(imgStart + 2, openParen - 1)
        const dataUrl = safeText.slice(openParen + 1, closeParen)

        const token = `___DATA_IMG_TOKEN_${dataUrlStore.length}___`
        const caption = alt ? `<figcaption class="text-center text-xs text-slate-500 mt-2 font-medium">📷 ${escapeHtml(alt)} (클릭하여 고화질 확대)</figcaption>` : ''
        const html = `<figure class="my-6 group cursor-zoom-in"><img src="${dataUrl}" alt="${escapeHtml(alt)}" data-zoomable="true" class="w-full rounded-2xl border border-slate-200 shadow-sm object-contain max-h-[520px] transition-all duration-200 group-hover:shadow-md hover:brightness-105" />${caption}</figure>`

        dataUrlStore.push(html)
        safeText = safeText.slice(0, imgStart) + token + safeText.slice(closeParen + 1)
        pos = imgStart + token.length
        continue
      }
    }

    pos = dataIdx + 11
  }

  return { safeText, dataUrlStore }
}

function inline(text: string): string {
  // 1. 대용량 Base64 이미지 텍스트를 비-정규식(Regex-Free) 탐색으로 사전 이격 보호
  const { safeText, dataUrlStore } = extractAndProtectDataImages(text)

  let escaped = escapeHtml(safeText)

  // 2. 일반 (HTTP/HTTPS) 이미지 URL 파싱 (작은 텍스트 파싱)
  escaped = escaped.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, url: string) => {
    const cleanUrl = url.replace(/&amp;/g, '&')
    const safe = sanitizeUrl(cleanUrl)
    if (!safe) return alt
    const caption = alt ? `<figcaption class="text-center text-xs text-slate-500 mt-2 font-medium">📷 ${alt} (클릭하여 고화질 확대)</figcaption>` : ''
    return `<figure class="my-6 group cursor-zoom-in"><img src="${safe}" alt="${alt}" data-zoomable="true" class="w-full rounded-2xl border border-slate-200 shadow-sm object-contain max-h-[520px] transition-all duration-200 group-hover:shadow-md hover:brightness-105" />${caption}</figure>`
  })

  // 3. 일반 링크 파싱
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText: string, url: string) => {
    const cleanUrl = url.replace(/&amp;/g, '&')
    const safe = sanitizeUrl(cleanUrl)
    return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline font-semibold hover:text-indigo-800">${linkText}</a>` : linkText
  })

  // 4. **굵게**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // 5. *기울임*
  escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  // 6. `코드`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')

  // 7. 사전 보호된 대용량 Base64 HTML 토큰 복원
  dataUrlStore.forEach((html, idx) => {
    escaped = escaped.replace(`___DATA_IMG_TOKEN_${idx}___`, html)
  })

  return escaped
}

/**
 * 뭉친 대용량 문단을 2~3문장 단위(약 120~160자)로 자연스럽게 줄바꿈(소문단 분할)해주는 가독성 유틸리티
 */
export function formatReadableParagraphs(text: string): string {
  if (!text || text.trim().length === 0) return text

  const paragraphs = text.split(/\n\s*\n/)

  const formatted = paragraphs.map((p) => {
    const trimmed = p.trim()
    if (trimmed.length < 200) return trimmed

    const sentences = trimmed.split(/(?<=[.!?])\s+/)
    if (sentences.length <= 2) return trimmed

    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentLen = 0

    for (const sentence of sentences) {
      currentChunk.push(sentence)
      currentLen += sentence.length

      if (currentChunk.length >= 2 && currentLen >= 120) {
        chunks.push(currentChunk.join(' '))
        currentChunk = []
        currentLen = 0
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
    }

    return chunks.join('\n\n')
  })

  return formatted.join('\n\n')
}

export function mdLiteToHtml(raw: string): string {
  const formattedRaw = formatReadableParagraphs(raw || '')
  const lines = formattedRaw.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let paragraphBuf: string[] = []
  let listBuf: string[] = []
  let i = 0

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      const fullText = paragraphBuf.join(' ')
      const splitText = formatReadableParagraphs(fullText)
      const subParagraphs = splitText.split('\n\n')
      subParagraphs.forEach((subP) => {
        if (subP.trim()) {
          blocks.push(`<p class="leading-relaxed mb-5 text-slate-800">${inline(subP.trim())}</p>`)
        }
      })
      paragraphBuf = []
    }
  }

  const flushList = () => {
    if (listBuf.length > 0) {
      blocks.push(
        '<ul class="list-disc list-inside space-y-1.5 mb-4 text-slate-800">' +
          listBuf.map((item) => `<li>${inline(item)}</li>`).join('') +
          '</ul>'
      )
      listBuf = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      flushParagraph()
      flushList()
      const lang = trimmed.replace(/^```/, '').trim() || 'text'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      const rawCode = codeLines.join('\n')
      blocks.push(
        `<div class="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">` +
          `<div class="flex items-center gap-2 bg-slate-900 px-4 py-2 border-b border-slate-800 text-slate-400 text-xs font-mono font-semibold uppercase tracking-wider">` +
            `<span class="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500/80"></span>` +
            `<span class="text-slate-300">${escapeHtml(lang)}</span>` +
          `</div>` +
          `<pre class="p-4 overflow-x-auto text-xs font-mono text-slate-200 bg-slate-950 leading-relaxed"><code>${escapeHtml(rawCode)}</code></pre>` +
        `</div>`
      )
      continue
    }

    if (/^####\s+/.test(trimmed)) {
      flushParagraph()
      flushList()
      const titleText = trimmed.replace(/^####\s+/, '')
      blocks.push(
        `<div class="flex items-center justify-between mt-8 mb-3 pb-2 border-b border-slate-200/80">` +
          `<h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">${inline(titleText)}</h4>` +
          `<button type="button" data-copy-btn="true" onclick="const flexDiv=this.closest('.flex'); const codeEl=flexDiv ? flexDiv.nextElementSibling?.querySelector('code') : null; if(codeEl){navigator.clipboard.writeText(codeEl.innerText).then(()=>{const self=this; const orig=self.innerHTML; self.innerHTML='✓ 복사완료!'; self.classList.add('text-emerald-600','border-emerald-500','bg-emerald-50'); setTimeout(()=>{self.innerHTML=orig; self.classList.remove('text-emerald-600','border-emerald-500','bg-emerald-50');}, 2000);});}" class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shadow-indigo-100/50">` +
            `📋 프롬프트 복사` +
          `</button>` +
        `</div>`
      )
      i++
      continue
    }

    if (/^###\s+/.test(trimmed)) {
      flushParagraph()
      flushList()
      blocks.push(`<h3 class="text-base font-bold text-slate-900 mt-6 mb-2">${inline(trimmed.replace(/^###\s+/, ''))}</h3>`)
      i++
      continue
    }

    if (/^##\s+/.test(trimmed)) {
      flushParagraph()
      flushList()
      blocks.push(`<h2 class="text-xl font-extrabold text-slate-900 mt-8 mb-3 pb-1 border-b border-slate-100">${inline(trimmed.replace(/^##\s+/, ''))}</h2>`)
      i++
      continue
    }

    if (/^#\s+/.test(trimmed)) {
      flushParagraph()
      flushList()
      blocks.push(`<h1 class="text-2xl font-black text-slate-900 mt-10 mb-4">${inline(trimmed.replace(/^#\s+/, ''))}</h1>`)
      i++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph()
      flushList()
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(`<blockquote class="border-l-4 border-indigo-500 bg-indigo-50/60 text-slate-700 p-4 rounded-r-xl my-4 text-sm font-medium leading-relaxed">${inline(quoteLines.join(' '))}</blockquote>`)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      listBuf.push(trimmed.replace(/^[-*]\s+/, ''))
      i++
      continue
    }

    if (trimmed === '---') {
      flushParagraph()
      flushList()
      blocks.push('<hr class="my-6 border-slate-200" />')
      i++
      continue
    }

    if (trimmed === '') {
      flushParagraph()
      flushList()
      i++
      continue
    }

    paragraphBuf.push(trimmed)
    i++
  }

  flushParagraph()
  flushList()

  return blocks.join('\n')
}

export function estimateReadingMinutes(text: string): number {
  const clean = text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1')
  const words = clean.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function extractExcerpt(text: string, maxLength: number = 160): string {
  const clean = text
    .replace(/^#+\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length <= maxLength) return clean
  return clean.slice(0, maxLength) + '...'
}
