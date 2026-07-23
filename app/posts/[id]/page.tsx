'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

/* ------------------------------------------------------------------ */
/*  HTML5 Canvas Image Compression Helper                              */
/* ------------------------------------------------------------------ */
async function compressBase64Image(dataUrl: string, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Category {
  id: number
  name: string
  slug: string
}

interface Author {
  id: number
  name: string
  role: string
  avatar_url: string | null
}

interface Post {
  id: number
  title: string
  excerpt: string
  content: string
  published_at: string
  reading_minutes: number
  like_count: number
  author_id: number
}

interface Comment {
  id: number
  post_id: number
  user_id: string
  author_email: string
  content: string
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}일 전`
  return formatFullDate(dateStr)
}

function getInitials(name: string): string {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const COVER_GRADIENTS: Record<string, string> = {
  React: 'linear-gradient(135deg, #60a5fa, #1d4ed8)',
  아키텍처: 'linear-gradient(135deg, #818cf8, #4338ca)',
  Rust: 'linear-gradient(135deg, #f87171, #b91c1c)',
  DevOps: 'linear-gradient(135deg, #34d399, #047857)',
  Kubernetes: 'linear-gradient(135deg, #22d3ee, #0e7490)',
  TypeScript: 'linear-gradient(135deg, #60a5fa, #1e40af)',
  성능: 'linear-gradient(135deg, #fbbf24, #b45309)',
  JavaScript: 'linear-gradient(135deg, #fde047, #a16207)',
  Go: 'linear-gradient(135deg, #2dd4bf, #0f766e)',
  Docker: 'linear-gradient(135deg, #818cf8, #3730a3)',
  데이터베이스: 'linear-gradient(135deg, #c4b5fd, #6d28d9)',
  보안: 'linear-gradient(135deg, #f9a8d4, #be185d)',
}
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #94a3b8, #334155)'

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function PostDetailPage() {
  const params = useParams()
  const postId = Number(params?.id)
  const supabase = useMemo(() => createClient(), [])

  const [post, setPost] = useState<Post | null>(null)
  const [author, setAuthor] = useState<Author | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const [likeCount, setLikeCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [compressing, setCompressing] = useState(false)

  // 고화질 이미지 라이트박스 팝업 상태
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedAlt, setSelectedAlt] = useState<string>('')

  // ESC 키로 이미지 팝업 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 본문 내 이미지 클릭 감지 핸들러
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src')
      const alt = target.getAttribute('alt') || ''
      if (src) {
        setSelectedImage(src)
        setSelectedAlt(alt)
      }
    }
  }

  /* ---- Fetch post + relations ---- */
  const fetchPost = useCallback(async () => {
    setLoading(true)

    const { data: postData } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (!postData) {
      setNotFound(true)
      setLoading(false)
      return
    }
    setPost(postData)

    const { data: authorData } = await supabase
      .from('blog_authors')
      .select('*')
      .eq('id', postData.author_id)
      .single()
    setAuthor(authorData ?? null)

    const { data: pcData } = await supabase
      .from('blog_post_categories')
      .select('category_id')
      .eq('post_id', postId)
    const catIds = pcData?.map((r) => r.category_id) ?? []
    if (catIds.length > 0) {
      const { data: catsData } = await supabase
        .from('blog_categories')
        .select('*')
        .in('id', catIds)
      setCategories(catsData ?? [])
    } else {
      setCategories([])
    }

    const { data: commentsData } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments(commentsData ?? [])

    const { count: likesCount } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
    setLikeCount(likesCount ?? 0)

    setLoading(false)
  }, [supabase, postId])

  useEffect(() => {
    if (postId) {
      queueMicrotask(() => {
        fetchPost()
      })
    }
  }, [fetchPost, postId])

  /* ---- Auth state ---- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setUserId(data.user?.id ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  /* ---- Check whether current user already liked this post ---- */
  useEffect(() => {
    async function checkLiked() {
      if (!userId) {
        setHasLiked(false)
        return
      }
      const { data } = await supabase
        .from('blog_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()
      setHasLiked(!!data)
    }
    if (postId) {
      queueMicrotask(() => {
        checkLiked()
      })
    }
  }, [supabase, postId, userId])

  /* ---- Like toggle ---- */
  const handleLikeToggle = async () => {
    if (!userId || likeBusy) return
    setLikeBusy(true)

    if (hasLiked) {
      setHasLiked(false)
      setLikeCount((c) => Math.max(0, c - 1))
      const { error } = await supabase.from('blog_likes').delete().eq('post_id', postId).eq('user_id', userId)
      if (error) {
        setHasLiked(true)
        setLikeCount((c) => c + 1)
      }
    } else {
      setHasLiked(true)
      setLikeCount((c) => c + 1)
      const { error } = await supabase.from('blog_likes').insert({ post_id: postId, user_id: userId })
      if (error) {
        setHasLiked(false)
        setLikeCount((c) => Math.max(0, c - 1))
      }
    }
    setLikeBusy(false)
  }

  /* ---- Comment submit ---- */
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCommentError(null)
    if (!commentText.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setCommentError('로그인 후 댓글을 작성할 수 있습니다.')
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        author_email: user.email,
        content: commentText.trim(),
      })
      .select()
      .single()
    setSubmitting(false)

    if (error) {
      setCommentError('댓글 등록에 실패했습니다. 다시 시도해주세요.')
      return
    }
    if (data) {
      setComments((prev) => [...prev, data])
      setCommentText('')
    }
  }

  /* ---- Comment delete ---- */
  const handleCommentDelete = async (commentId: number) => {
    const prev = comments
    setComments((cs) => cs.filter((c) => c.id !== commentId))
    const { error } = await supabase.from('blog_comments').delete().eq('id', commentId)
    if (error) {
      setComments(prev)
    }
  }

  const coverGradient = categories[0]
    ? COVER_GRADIENTS[categories[0].name] ?? DEFAULT_GRADIENT
    : DEFAULT_GRADIENT

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
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
            <Link href="/" className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors" aria-label="검색">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>
            {userEmail ? (
              <>
                <Link href="/write/ai-form" className="text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 rounded-lg no-underline transition-colors">글쓰기</Link>
                <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">
                  {userEmail}
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 no-underline transition-colors">로그인</Link>
                <Link href="/auth" className="text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-lg no-underline transition-colors">가입하기</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =================== MAIN CONTENT =================== */}
      <main className="flex-1 max-w-[760px] w-full mx-auto px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4"></div>
            <div className="skeleton h-5 w-1/3"></div>
            <div className="skeleton h-64 w-full"></div>
            <div className="skeleton h-5 w-full"></div>
            <div className="skeleton h-5 w-full"></div>
          </div>
        ) : notFound || !post ? (
          <div className="text-center py-24">
            <p className="text-zinc-500 text-lg mb-4">게시글을 찾을 수 없습니다.</p>
            <Link href="/" className="text-[var(--primary)] font-semibold no-underline hover:underline">
              홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {/* Back link */}
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 no-underline mb-6 transition-colors">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              목록으로
            </Link>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug mb-4">
              {post.title}
            </h1>

            {/* Author + meta + Action Buttons */}
            <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                {author && (
                  <>
                    <div className="avatar-circle">{getInitials(author.name)}</div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 leading-tight">{author.name}</p>
                      <p className="text-xs text-zinc-400">
                        {author.role} · {formatFullDate(post.published_at)} · {post.reading_minutes}분 읽기
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* 포스트 관리 (본문 복사 / 수정 / 삭제) 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  disabled={compressing}
                  onClick={async () => {
                    if (!post || compressing) return
                    try {
                      setCompressing(true)
                      let rawContent = post.content || ''

                      // ★ 본문 복사 전 하단 프롬프트 및 API 요청 스키마 구역 전면 정제 (티스토리/블로그 붙여넣기 전용)
                      const promptSectionIdx = rawContent.search(/(<h[1-6][^>]*>[^<]*🎨\s*생성\s*이미지|<hr[^>]*>\s*<h[1-6][^>]*>[^<]*🎨|🎨\s*생성\s*이미지\s*AI\s*프롬프트)/i)
                      if (promptSectionIdx !== -1) {
                        let cleanCutIdx = promptSectionIdx
                        const priorHr = rawContent.lastIndexOf('<hr', promptSectionIdx)
                        if (priorHr !== -1 && promptSectionIdx - priorHr < 100) {
                          cleanCutIdx = priorHr
                        }
                        rawContent = rawContent.slice(0, cleanCutIdx).trim()
                      }
                      
                      // 1. 인라인 자바스크립트(onclick=...) 정제
                      rawContent = rawContent.replace(/onclick="[^"]*"/gi, '')

                      // 2. Base64 이미지 바이너리 추출 및 HTML5 Canvas 스마트 압축 (4MB -> 250KB)
                      const dataUrlMatches: string[] = []
                      rawContent.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, (m) => {
                        dataUrlMatches.push(m)
                        return m
                      })

                      let compressedContent = rawContent

                      if (dataUrlMatches.length > 0) {
                        for (let idx = 0; idx < dataUrlMatches.length; idx++) {
                          const originalSrc = dataUrlMatches[idx]
                          const compressedSrc = await compressBase64Image(originalSrc, 1000, 0.75)
                          compressedContent = compressedContent.split(originalSrc).join(compressedSrc)
                        }
                      }

                      const plainText = compressedContent
                        .replace(/<figcaption[^>]*>.*?<\/figcaption>/gi, '')
                        .replace(/<[^>]+>/g, '')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim()

                      if (navigator.clipboard && window.ClipboardItem) {
                        const htmlBlob = new Blob([compressedContent], { type: 'text/html' })
                        const textBlob = new Blob([plainText], { type: 'text/plain' })
                        const item = new ClipboardItem({
                          'text/html': htmlBlob,
                          'text/plain': textBlob,
                        })
                        await navigator.clipboard.write([item])
                      } else {
                        await navigator.clipboard.writeText(compressedContent)
                      }

                      setCompressing(false)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 3000)
                    } catch (err) {
                      console.error('[Copy Error]:', err)
                      setCompressing(false)
                      try {
                        const simpleText = (post.content || '').replace(/<[^>]+>/g, '').trim()
                        await navigator.clipboard.writeText(simpleText)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 3000)
                      } catch {
                        alert('본문 복사 중 오류가 발생했습니다.')
                      }
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                    compressing
                      ? 'bg-amber-500 text-white animate-pulse'
                      : copied
                      ? 'bg-emerald-600 text-white shadow-emerald-200 font-extrabold'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                  }`}
                >
                  {compressing ? '⏳ 이미지 750KB 압축 중...' : copied ? '✓ 본문 & 이미지 복사 완료! (Ctrl+V로 붙여넣으세요)' : '📋 본문 복사하기'}
                </button>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer no-underline shadow-sm"
                >
                  ✏️ 수정
                </Link>
                <button
                  onClick={async () => {
                    if (confirm('정말로 이 게시글을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.')) {
                      try {
                        const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
                        const json = await res.json()
                        if (res.ok && json.success) {
                          alert('게시글이 성공적으로 삭제되었습니다.')
                          window.location.href = '/'
                        } else {
                          alert(json.error || '게시글 삭제에 실패했습니다.')
                        }
                      } catch {
                        alert('서버 통신 중 오류가 발생했습니다.')
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>

            {/* Category tags */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-6">
                {categories.map((cat) => (
                  <span key={cat.id} className="category-tag" data-category={cat.name}>
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Cover Box Removed - Real Photorealistic AI Header Image render in post-content */}

            {/* Content (클릭 시 라이트박스 팝업 연동) */}
            <div
              className="post-content"
              onClick={handleContentClick}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Action bar */}
            <div className="flex items-center justify-between border-t border-b border-[var(--border)] py-4 my-10">
              <div className="flex items-center gap-5 text-zinc-500 text-sm">
                {userId ? (
                  <button
                    type="button"
                    onClick={handleLikeToggle}
                    disabled={likeBusy}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${hasLiked ? 'text-red-500 font-semibold' : 'hover:text-red-500'}`}
                    aria-pressed={hasLiked}
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    {likeCount.toLocaleString()}
                  </button>
                ) : (
                  <Link href="/auth" className="flex items-center gap-1.5 hover:text-red-500 transition-colors no-underline">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    {likeCount.toLocaleString()}
                  </Link>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  {comments.length}
                </span>
              </div>
            </div>

            {/* Comments */}
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">댓글 ({comments.length})</h2>

              {userEmail ? (
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="토론에 참여해보세요..."
                    rows={3}
                    className="w-full text-sm p-4 bg-zinc-50 border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all resize-none"
                  />
                  {commentError && (
                    <p className="text-xs text-red-600 mt-2">{commentError}</p>
                  )}
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                      className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      댓글 작성
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-zinc-50 border border-[var(--border)] rounded-xl text-sm text-zinc-500 text-center">
                  <Link href="/auth" className="text-[var(--primary)] font-semibold no-underline hover:underline">
                    로그인
                  </Link>{' '}
                  후 댓글을 작성할 수 있습니다.
                </div>
              )}

              {comments.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">첫 댓글을 남겨보세요.</p>
              ) : (
                <ul className="space-y-5">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <div className="avatar-circle flex-shrink-0">{getInitials(c.author_email)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-800">{c.author_email}</span>
                          <span className="text-xs text-zinc-400">{formatRelative(c.created_at)}</span>
                          {userId === c.user_id && (
                            <button
                              type="button"
                              onClick={() => handleCommentDelete(c.id)}
                              className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer ml-auto"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 mt-1 leading-relaxed break-words">{c.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {/* =================== FOOTER =================== */}
      <footer className="border-t border-[var(--border)] bg-zinc-50">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-lg font-extrabold text-zinc-900 tracking-tight">AutoBlog</span>
          <nav className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">문서</Link>
            <Link href="/changelog" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">변경 내역</Link>
            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-900 no-underline transition-colors">개인정보 처리방침</Link>
          </nav>
        </div>
      </footer>

      {/* =================== LIGHTBOX POPUP MODAL =================== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white/80 mb-3 px-2">
            <span className="text-xs font-medium text-slate-300 truncate max-w-[80%]">
              📷 {selectedAlt || '고화질 AI 원본 이미지'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full transition-colors backdrop-blur flex items-center gap-1 cursor-pointer"
            >
              <span>✕ 닫기 (Esc)</span>
            </button>
          </div>

          {/* Image Container */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt={selectedAlt || '고화질 원본 이미지'}
              className="max-w-full max-h-[85vh] object-contain select-none transition-all duration-200"
            />
          </div>

          <p className="text-slate-400 text-xs mt-3 font-medium">
            💡 바깥 영역 클릭 또는 ESC 키로 닫으실 수 있습니다
          </p>
        </div>
      )}
    </div>
  )
}
