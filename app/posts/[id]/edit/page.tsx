'use client'

import { useEffect, useState, useMemo, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mdLiteToHtml } from '@/utils/markdown'
import { createClient } from '@/utils/supabase/client'

interface Category {
  id: number
  name: string
  slug: string
}

interface PostEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * HTML 코드를 깨끗한 마크다운/순수 텍스트로 변환하는 정제 유틸리티 (대용량 Base64 이미지 보존)
 */
function htmlToMarkdownWithImageStore(
  htmlText: string,
  imageStore: Map<string, string>
): string {
  if (!htmlText) return ''
  imageStore.clear()
  let count = 0

  let str = htmlText

  // HTML Entity 복원
  str = str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")

  // 0. '### 🎨 생성 이미지 AI 프롬프트 및 API 요청 스키마' 이하 디버그 스키마 섹션 전면 제거
  const schemaIdx = str.indexOf('### 🎨 생성 이미지 AI 프롬프트')
  if (schemaIdx !== -1) {
    str = str.slice(0, schemaIdx).trim()
  }
  const altSchemaIdx = str.indexOf('🎨 생성 이미지 AI 프롬프트')
  if (altSchemaIdx !== -1) {
    str = str.slice(0, altSchemaIdx).trim()
  }

  // 1. V8 정규식 오버플로우 100% 방지 Non-Regex Pure String Slicing으로 Base64 바이너리 [첨부이미지 N] 치환
  let searchIdx = 0
  let htmlIter = str

  while (true) {
    const startIdx = htmlIter.indexOf('data:image/', searchIdx)
    if (startIdx === -1) break

    let endIdx = htmlIter.indexOf('"', startIdx)
    const endAltIdx = htmlIter.indexOf(')', startIdx)

    if (endIdx === -1 || (endAltIdx !== -1 && endAltIdx < endIdx)) {
      endIdx = endAltIdx
    }

    if (endIdx === -1) {
      endIdx = Math.min(htmlIter.length, startIdx + 10000)
    }

    const b64Match = htmlIter.slice(startIdx, endIdx)
    count++
    const key = `[첨부이미지 ${count}]`
    imageStore.set(key, b64Match)

    htmlIter = htmlIter.slice(0, startIdx) + key + htmlIter.slice(endIdx)
    searchIdx = startIdx + key.length
  }
  str = htmlIter

  // 2. 일반 HTTP URL 이미지 파싱
  str = str.replace(/<figure[^>]*>\s*<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>\s*(?:<figcaption[^>]*>.*?<\/figcaption>)?\s*<\/figure>/gi, '\n![$2]($1)\n')
  str = str.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '\n![$2]($1)\n')

  // 3. blockquote ➔ >
  str = str.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_m, inner) => {
    const cleanInner = inner.replace(/<[^>]+>/g, '').trim()
    return `\n> ${cleanInner}\n`
  })

  // 4. Headings
  str = str.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
  str = str.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
  str = str.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')

  // 5. p 태그
  str = str.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')

  // 6. 기타 태그 정리
  str = str.replace(/<hr[^>]*>/gi, '\n---\n')
  str = str.replace(/<br\s*\/?>/gi, '\n')
  str = str.replace(/<[^>]+>/g, '')

  // 7. 연속 개행 정리
  str = str.replace(/\n{3,}/g, '\n\n').trim()

  return str
}

export default function PostEditPage({ params }: PostEditPageProps) {
  const resolvedParams = use(params)
  const postId = resolvedParams.id
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // 원본 Base64 이미지 바이너리를 안전하게 1:1 보관하는 메모리 맵
  const imageStoreRef = useRef<Map<string, string>>(new Map())

  // 좌측 텍스트 내용 중 [첨부이미지 N] 키를 원본 Base64 바이너리로 복원 후 우측 시각적 HTML 렌더링
  const htmlPreview = useMemo(() => {
    let restoredContent = content
    imageStoreRef.current.forEach((src, key) => {
      restoredContent = restoredContent.replaceAll(key, src)
    })
    return mdLiteToHtml(restoredContent)
  }, [content])

  useEffect(() => {
    async function fetchAllCategories() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('blog_categories').select('*').order('id', { ascending: true })
        if (data && data.length > 0) {
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to fetch all categories:', err)
      }
    }
    fetchAllCategories()
  }, [])

  useEffect(() => {
    async function initData() {
      try {
        setLoading(true)

        const postRes = await fetch(`/api/posts/${postId}`)
        const postJson = await postRes.json()

        if (postRes.ok && postJson.success && postJson.data) {
          const p = postJson.data
          setTitle(p.title || '')
          setExcerpt(p.excerpt || '')

          // 대용량 Base64 바이너리를 [첨부이미지 1, 2, 3]으로 치환하고 원본은 imageStoreRef에 보존
          const cleanText = htmlToMarkdownWithImageStore(p.content || '', imageStoreRef.current)
          setContent(cleanText)
        } else {
          setError(postJson.error || '게시글 정보를 불러오지 못했습니다.')
        }
      } catch (err: any) {
        setError('서버 연결 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      initData()
    }
  }, [postId])

  // 툴바 헬퍼 (마크다운 태그 감싸기)
  const insertFormatting = (prefix: string, suffix = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end) || '텍스트'
    const next = content.slice(0, start) + prefix + selected + suffix + content.slice(end)
    setContent(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 본문 내용을 모두 입력해 주세요.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // 5MB 바이너리를 네트워크로 보내지 않고 수정한 5KB 마크다운 텍스트만 초경량 전송
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          categoryId: selectedCategoryId,
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        alert('게시글이 성공적으로 수정되었습니다.')
        router.push(`/posts/${postId}`)
        router.refresh()
      } else {
        const errorDetail = json.details ? JSON.stringify(json.details) : ''
        setError(json.error || `수정 저장 중 오류가 발생했습니다. ${errorDetail}`)
      }
    } catch (err: any) {
      setError('서버 통신 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">게시글 텍스트 정제 및 에디터를 불러오는 중...</p>
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 mb-6">
          <p className="font-semibold text-lg">⚠️ {error}</p>
        </div>
        <Link
          href={`/posts/${postId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-all"
        >
          ← 게시글로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 상단 헤더 바 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black text-indigo-600 no-underline">
              AutoBlog
            </Link>
            <span className="text-xs font-bold text-slate-300">|</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              ✨ 게시글 내용 수정 에디터
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/posts/${postId}`}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all no-underline"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  저장 중...
                </>
              ) : (
                <>✨ 수정 완료 및 발행</>
              )}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-[1600px] mx-auto px-6 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* 좌우 분할 에디터 컨테이너 */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= 좌측: 순수 글 제목 & 내용 수정 폼 ([첨부이미지 N] 대체) ================= */}
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1">
              <span>🏷️ 게시글 카테고리 선택</span>
            </label>
            <select
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full text-xs font-bold text-indigo-700 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">카테고리 선택 (선택 안함)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* 제목 입력 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">게시글 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요..."
              className="w-full text-lg sm:text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* 요약문 입력 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">요약글 (Excerpt)</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="게시글 요약 내용을 입력하세요..."
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>

          {/* 서식 툴바 */}
          <div className="flex items-center gap-1 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="굵게 (Bold)"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all italic"
              title="기울임 (Italic)"
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('`', '`')}
              className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="인라인 코드"
            >
              &lt;/&gt;
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => insertFormatting('[', '](https://)')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="링크 삽입"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('![이미지 설명](', ')')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="이미지 삽입"
            >
              🖼️
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n## ')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="소제목 (H2)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n> ')}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all"
              title="인용구 (Quote)"
            >
              &quot;
            </button>
          </div>

          {/* 순수 본문 내용 에디터 ([첨부이미지 1, 2, 3] 플레이스홀더 치환) */}
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="게시글 본문 내용을 수정하세요..."
              rows={22}
              className="w-full h-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm leading-relaxed focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
            />
          </div>
        </div>

        {/* ================= 우측: 좌측 [첨부이미지 N] ➔ 원본 실사 이미지 1:1 복원 렌더링 ================= */}
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              🎨 실시간 결과 미리보기 (Visual Live Preview)
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Live Synced & Image Restored
            </span>
          </div>

          {/* 블로그 상세 페이지와 100% 동일한 시각적 예쁜 렌더링 영역 */}
          <div className="flex-1 overflow-y-auto max-h-[750px] pr-2 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {title || '제목이 여기에 표시됩니다'}
            </h1>

            {excerpt && (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/70 text-slate-800 p-4 rounded-r-xl text-sm font-medium leading-relaxed">
                {excerpt}
              </blockquote>
            )}

            <div
              className="prose prose-slate max-w-none text-slate-800 space-y-4 text-sm sm:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: htmlPreview }}
            />
          </div>
        </div>

      </div>
    </main>
  )
}
