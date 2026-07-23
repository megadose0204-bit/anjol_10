'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PostEditPageProps {
  params: Promise<{ id: string }>
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPostData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/posts/${postId}`)
        const json = await res.json()

        if (res.ok && json.success && json.data) {
          setTitle(json.data.title || '')
          setExcerpt(json.data.excerpt || '')
          setContent(json.data.content || '')
        } else {
          setError(json.error || '게시글 정보를 불러오지 못했습니다.')
        }
      } catch (err: any) {
        setError('서버 연결 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPostData()
    }
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 본문 내용을 모두 입력해 주세요.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        alert('게시글이 성공적으로 수정되었습니다.')
        router.push(`/posts/${postId}`)
        router.refresh()
      } else {
        setError(json.error || '수정 저장 중 오류가 발생했습니다.')
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
        <p className="text-sm font-medium text-slate-600">게시글 정보를 불러오는 중...</p>
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
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2.5 py-1 rounded-full">
              Post Editor
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">게시글 수정하기</h1>
          </div>
          <Link
            href={`/posts/${postId}`}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            취소 및 돌아가기
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* 제목 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              게시글 제목 <span className="text-indigo-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg"
            />
          </div>

          {/* 요약 입력 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              요약문 (Excerpt)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="게시글 요약 내용을 입력하세요"
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* 본문 에디터 (마크다운) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-900">
                마크다운 본문 내용 <span className="text-indigo-600">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">Markdown Supported</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운 형식으로 본문 내용을 수정하세요"
              rows={18}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href={`/posts/${postId}`}
              className="px-5 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-sm rounded-xl transition-all"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  저장 중...
                </>
              ) : (
                <>✨ 수정 저장하기</>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
