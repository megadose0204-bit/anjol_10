'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { mdLiteToHtml, estimateReadingMinutes, extractExcerpt } from '@/utils/markdown'

interface Category {
  id: number
  name: string
  slug: string
}

const DRAFT_KEY = 'devflow-draft'
const MAX_CATEGORIES = 4

export default function WritePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  const [draftMsg, setDraftMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  /* ---- Auto Post State ---- */
  const [autoTopic, setAutoTopic] = useState('')
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoStatus, setAutoStatus] = useState<string | null>(null)

  /* ---- Auth check + draft restore ---- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setUserEmail(data.user?.email ?? null)
      setAuthChecked(true)
    })

    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.title) setTitle(draft.title)
          if (draft.content) setContent(draft.content)
          if (Array.isArray(draft.selectedCategoryIds)) setSelectedCategoryIds(draft.selectedCategoryIds)
        }
      } catch {
        // 손상된 draft는 무시
      }
    })
  }, [supabase])

  /* ---- Categories ---- */
  useEffect(() => {
    supabase
      .from('blog_categories')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [supabase])

  const previewHtml = useMemo(() => mdLiteToHtml(content), [content])

  /* ---- Toolbar helpers ---- */
  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end) || placeholder
    const next = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length + selected.length + after.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  function insertLink() {
    const el = textareaRef.current
    if (!el) return
    const url = window.prompt('링크 URL을 입력하세요 (https://...)')
    if (!url) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const label = content.slice(start, end) || '링크'
    const next = content.slice(0, start) + `[${label}](${url})` + content.slice(end)
    setContent(next)
  }

  function insertImage() {
    const el = textareaRef.current
    if (!el) return
    const url = window.prompt('이미지 URL을 입력하세요 (https://...)')
    if (!url) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const alt = content.slice(start, end) || '이미지'
    const next = content.slice(0, start) + `![${alt}](${url})` + content.slice(end)
    setContent(next)
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length >= MAX_CATEGORIES) return prev
      return [...prev, id]
    })
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, selectedCategoryIds }))
    setDraftMsg('임시 저장되었습니다.')
    setTimeout(() => setDraftMsg(null), 2000)
  }

  async function handleAutoPost() {
    if (!autoTopic.trim()) {
      alert('자동 포스팅을 생성할 주제어(키워드)를 입력하세요. (예: 글로벌 증시, AI 기술, K8s)')
      return
    }
    setError(null)
    setAutoLoading(true)
    setAutoStatus('최근 24시간 실시간 뉴스를 수집하고 4대 신호를 분석 중입니다...')

    try {
      const res = await fetch('/api/auto-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: autoTopic.trim() }),
      })
      const result = await res.json()

      if (res.ok && result.success) {
        setAutoStatus(`포스팅 완! [${result.data.title}] 이동 중...`)
        setTimeout(() => {
          router.push(result.data.postUrl)
        }, 1200)
      } else {
        setError(result.error || '자동 포스팅 생성 중 오류가 발생했습니다.')
        setAutoLoading(false)
        setAutoStatus(null)
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.')
      setAutoLoading(false)
      setAutoStatus(null)
    }
  }

  async function handlePublish() {
    setError(null)
    if (!userId) {
      setError('로그인 후 발행할 수 있습니다.')
      return
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      setError('본문을 입력해주세요.')
      return
    }
    if (selectedCategoryIds.length === 0) {
      setError('카테고리를 최소 1개 선택해주세요.')
      return
    }

    setPublishing(true)

    const { data: existingAuthor } = await supabase
      .from('blog_authors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let authorId: number | null = existingAuthor?.id ?? null

    if (!authorId) {
      const displayName = userEmail?.split('@')[0] ?? '작성자'
      const { data: newAuthor, error: authorError } = await supabase
        .from('blog_authors')
        .insert({ name: displayName, role: '커뮤니티 작성자', user_id: userId })
        .select('id')
        .single()
      if (authorError || !newAuthor) {
        setError('작성자 정보를 생성하지 못했습니다.')
        setPublishing(false)
        return
      }
      authorId = newAuthor.id
    }

    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: title.trim(),
        excerpt: extractExcerpt(content),
        content: mdLiteToHtml(content),
        author_id: authorId,
        reading_minutes: estimateReadingMinutes(content),
      })
      .select('id')
      .single()

    if (postError || !newPost) {
      setError('게시글 발행에 실패했습니다. 다시 시도해주세요.')
      setPublishing(false)
      return
    }

    await supabase
      .from('blog_post_categories')
      .insert(selectedCategoryIds.map((categoryId) => ({ post_id: newPost.id, category_id: categoryId })))

    localStorage.removeItem(DRAFT_KEY)
    setPublishing(false)
    router.push(`/posts/${newPost.id}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* =================== HEADER =================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black text-indigo-600 no-underline">
            AutoBlog
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">탐색</Link>
            <Link href="/topics" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">주제</Link>
            <Link href="/community" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">커뮤니티</Link>
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            {userEmail ? (
              <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors truncate max-w-[160px]">
                {userEmail}
              </Link>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">로그인</Link>
                <Link href="/auth" className="text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg no-underline transition-colors">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {!authChecked ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="skeleton h-8 w-48"></div>
        </div>
      ) : !userId ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="text-zinc-600 mb-4">글을 작성하려면 로그인이 필요합니다.</p>
          <Link href="/auth" className="text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-5 py-2.5 rounded-lg no-underline transition-colors">
            로그인 / 회원가입
          </Link>
        </div>
      ) : (
        <>
          {/* =================== AI AUTO POST BAR =================== */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-indigo-100 py-3 px-6">
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div>
                  <h2 className="text-sm font-bold text-indigo-950">24시간 실시간 트렌드 AI 자동 포스팅</h2>
                  <p className="text-xs text-indigo-700">최근 24시간 네이버/구글 뉴스 수집 + 4대 신호 분석 기반 SEO 자동 생성</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/write/ai-form"
                  className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg no-underline transition-colors flex-shrink-0"
                >
                  ⚙️ 고급 AI 폼 스튜디오
                </Link>
                <input
                  type="text"
                  value={autoTopic}
                  onChange={(e) => setAutoTopic(e.target.value)}
                  placeholder="예: 인공지능 AI, 글로벌 증시..."
                  disabled={autoLoading}
                  className="text-xs bg-white border border-indigo-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 min-w-[180px]"
                />
                <button
                  type="button"
                  onClick={handleAutoPost}
                  disabled={autoLoading}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {autoLoading ? '분석 중...' : '⚡ 포스팅 실행'}
                </button>
              </div>
            </div>
            {autoStatus && (
              <div className="max-w-[1400px] mx-auto mt-2 text-xs font-medium text-indigo-800 animate-pulse">
                {autoStatus}
              </div>
            )}
          </div>

          {/* =================== EDITOR TOOLBAR =================== */}
          <div className="border-b border-[var(--border)]">
            <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-4 h-16">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요..."
                className="flex-1 text-2xl font-extrabold text-zinc-900 placeholder-zinc-300 focus:outline-none min-w-0"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => wrapSelection('**', '**', '굵은 텍스트')} className="toolbar-btn" aria-label="굵게" title="굵게">
                  <strong>B</strong>
                </button>
                <button type="button" onClick={() => wrapSelection('*', '*', '기울임 텍스트')} className="toolbar-btn italic" aria-label="기울임" title="기울임">
                  I
                </button>
                <button type="button" onClick={() => wrapSelection('`', '`', '코드')} className="toolbar-btn font-mono text-xs" aria-label="인라인 코드" title="인라인 코드">
                  {'</>'}
                </button>
                <button type="button" onClick={insertLink} className="toolbar-btn" aria-label="링크 삽입" title="링크 삽입">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </button>
                <button type="button" onClick={insertImage} className="toolbar-btn" aria-label="이미지 삽입" title="이미지 삽입">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 3h18v18H3V3Z" />
                  </svg>
                </button>
              </div>
              <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
              <button
                type="button"
                onClick={handleSaveDraft}
                className="text-sm font-semibold text-zinc-600 hover:bg-zinc-50 border border-[var(--border)] px-4 py-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
              >
                임시 저장
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {publishing ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                )}
                발행
              </button>
            </div>
          </div>

          {/* =================== CATEGORY SELECT =================== */}
          <div className="border-b border-[var(--border)]">
            <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-2 flex-wrap">
              <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              </svg>
              <span className="text-xs text-zinc-400 mr-1">카테고리를 최대 {MAX_CATEGORIES}개까지 선택하세요</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`filter-btn ${selectedCategoryIds.includes(cat.id) ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="max-w-[1400px] mx-auto w-full px-6 pt-3">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}
          {draftMsg && (
            <div className="max-w-[1400px] mx-auto w-full px-6 pt-3">
              <p className="text-xs text-emerald-600 font-medium">{draftMsg}</p>
            </div>
          )}

          {/* =================== EDITOR / PREVIEW =================== */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'내용을 입력하세요... (## 제목, > 인용, ```코드```, - 목록, **굵게**, *기울임*, `코드`, [링크](url) 지원)'}
              className="min-h-[500px] p-6 text-sm leading-relaxed text-zinc-800 focus:outline-none resize-none border-r border-[var(--border)] font-mono"
            />
            <div className="p-6 post-content overflow-auto">
              {content.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <p className="text-zinc-300">미리보기가 여기에 표시됩니다.</p>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  )
}
