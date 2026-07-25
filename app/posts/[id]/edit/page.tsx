'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  slug: string
}

/* ------------------------------------------------------------------ */
/*  Base64 -> [첨부 이미지 N] 표기 전환 유틸리티                        */
/* ------------------------------------------------------------------ */
function replaceBase64WithImageTags(contentStr: string): string {
  if (!contentStr || !contentStr.includes('data:image/')) {
    return contentStr
  }

  let updated = contentStr
  let searchIdx = 0
  let imageCounter = 1

  while (true) {
    const startIdx = updated.indexOf('data:image/', searchIdx)
    if (startIdx === -1) break

    let endIdx = updated.indexOf('"', startIdx)
    const endAlt1 = updated.indexOf("'", startIdx)
    const endAlt2 = updated.indexOf(")", startIdx)
    const endAlt3 = updated.indexOf(" ", startIdx)

    let validEnds = [endIdx, endAlt1, endAlt2, endAlt3].filter(idx => idx > startIdx)
    if (validEnds.length === 0) break

    endIdx = Math.min(...validEnds)

    const tag = `[첨부 이미지 ${imageCounter}]`
    updated = updated.slice(0, startIdx) + tag + updated.slice(endIdx)
    searchIdx = startIdx + tag.length
    imageCounter++
  }

  return updated
}

export default function PostEditPage() {
  const params = useParams()
  const postId = (params?.id as string) || ''
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')

  // rawContent: DB 원본 그대로 (Base64 이미지 포함) — 비주얼 모드용
  const [rawContent, setRawContent] = useState('')
  // codeContent: [첨부 이미지 N] 태그로 치환된 경량 텍스트 — 코드 모드용
  const [codeContent, setCodeContent] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])

  // 듀얼 에디터 모드
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const visualContentRef = useRef<HTMLDivElement>(null)

  // 1. 게시글 데이터 로드
  useEffect(() => {
    if (!postId) return

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/posts/${postId}`)
        if (!res.ok) {
          throw new Error('게시글을 가져오는 데 실패했습니다. (Status: ' + res.status + ')')
        }

        const postData = await res.json()
        setTitle(postData.title || '')
        setExcerpt(postData.excerpt || '')

        const original = postData.content || ''
        // 비주얼 모드: 원본 그대로 (실제 이미지 포함!)
        setRawContent(original)
        // 코드 모드: Base64 이미지를 [첨부 이미지 N] 으로 치환
        setCodeContent(replaceBase64WithImageTags(original))

        setSelectedCategoryIds(postData.category_ids || [])
        setCategories(postData.all_categories || [])
      } catch (err: any) {
        console.error('[Edit Page Load Error]:', err)
        setError(err.message || '게시글 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [postId])

  // 카테고리 탭 클릭 토글 핸들러
  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  // 에디터 서식 삽입 도구 유틸리티
  const insertFormatting = (prefix: string, suffix = '') => {
    if (editorMode === 'code' && textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = codeContent.substring(start, end) || '텍스트'
      const replacement = `${prefix}${selectedText}${suffix}`

      const newContent = codeContent.substring(0, start) + replacement + codeContent.substring(end)
      setCodeContent(newContent)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length)
      }, 0)
    } else {
      // 비주얼 모드일 때
      document.execCommand('styleWithCSS', false, 'true')
      if (prefix === '**') document.execCommand('bold')
      else if (prefix === '*') document.execCommand('italic')
      else if (prefix === '## ') document.execCommand('formatBlock', false, 'H2')
      else if (prefix === '### ') document.execCommand('formatBlock', false, 'H3')
      else if (prefix === '> ') document.execCommand('formatBlock', false, 'BLOCKQUOTE')
      else if (prefix === '- ') document.execCommand('insertUnorderedList')
    }
  }

  // 모드 전환 핸들러
  const switchToVisual = () => {
    // 코드 모드에서 비주얼로 전환 시: codeContent는 그대로 유지 (rawContent는 원본 DB 이미지를 보존하고 있음)
    setEditorMode('visual')
  }

  const switchToCode = () => {
    // 비주얼에서 코드 전환 시: 비주얼 contentEditable의 현재 HTML을 읽어서 이미지를 태그로 치환
    if (visualContentRef.current) {
      const visualHtml = visualContentRef.current.innerHTML
      setCodeContent(replaceBase64WithImageTags(visualHtml))
      setRawContent(visualHtml)
    }
    setEditorMode('code')
  }

  // 2. 수정 제출 (PUT /api/posts/[id]) - 원본 이미지 건드리지 않고 텍스트만 반영!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    try {
      setSaving(true)

      // 어떤 모드든 이미지를 [첨부 이미지 N] 태그로 치환하여 경량 전송
      let finalContent: string
      if (editorMode === 'visual' && visualContentRef.current) {
        finalContent = replaceBase64WithImageTags(visualContentRef.current.innerHTML)
      } else {
        finalContent = codeContent
      }

      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          content: finalContent,
          category_ids: selectedCategoryIds
        })
      })

      let json: any = {}
      try {
        json = await res.json()
      } catch (e) {
        json = { error: '서버 응답 파싱 실패 (Status: ' + res.status + ')' }
      }

      if (res.ok && json.success) {
        alert('게시글이 성공적으로 수정되었습니다.')
        window.location.href = `/posts/${postId}`
      } else {
        alert('수정 실패: ' + (json.error || '알 수 없는 오류 (Status: ' + res.status + ')'))
      }
    } catch (err: any) {
      console.error('[Edit Submit Error]:', err)
      alert('서버 통신 오류: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">듀얼 에디터 환경을 로딩하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white">{error}</h2>
          <Link
            href={`/posts/${postId}`}
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer no-underline shadow-md"
          >
            ← 게시글로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/posts/${postId}`}
              className="text-slate-400 hover:text-white text-sm font-semibold transition-colors no-underline flex items-center gap-1"
            >
              ← 취소
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">✏️</span>
              <h1 className="text-lg font-bold text-white">스마트 에디터 (수정 페이지)</h1>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {saving ? '수정 중...' : '✓ 수정 완료'}
          </button>
        </div>
      </header>

      {/* Main Single Column Editor */}
      <main className="max-w-5xl mx-auto w-full px-6 py-8 flex-1 flex flex-col space-y-6">
        {/* 1. 카테고리 선택 탭 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>📂</span> 카테고리 설정 (다중 선택 가능)
            </label>
            <span className="text-xs text-slate-400 font-medium">
              {selectedCategoryIds.length}개 선택됨
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    backgroundColor: isSelected ? '#2563eb' : '#1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: isSelected ? '800' : '600',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid #334155',
                    boxShadow: isSelected ? '0 4px 10px rgba(37, 99, 235, 0.3)' : 'none',
                    padding: '7px 16px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. 제목 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="게시글 제목을 입력하세요..."
            style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#1e293b' }}
            className="w-full rounded-2xl px-5 py-4 text-white text-lg font-extrabold placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner border"
          />
        </div>

        {/* 3. 요약 설명 */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">요약 설명 (Excerpt)</label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="게시글 요약 문구를 입력하세요..."
            style={{ backgroundColor: '#0f172a', color: '#f1f5f9', borderColor: '#1e293b' }}
            className="w-full rounded-2xl p-4 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner border"
          />
        </div>

        {/* 4. 듀얼 에디터 (비주얼 / 코드 탭 전환) */}
        <div
          style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          className="flex-1 flex flex-col border rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Editor Top Bar: Toolbar + Mode Switcher */}
          <div
            style={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
            className="border-b p-3 flex items-center justify-between gap-3 flex-wrap"
          >
            {/* Left: Formatting Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
                <span>🛠️</span> 서식:
              </span>
              <button type="button" onClick={() => insertFormatting('**', '**')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700" title="굵게">B 굵게</button>
              <button type="button" onClick={() => insertFormatting('*', '*')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold italic rounded-lg transition-colors cursor-pointer border border-slate-700" title="기울임">I 기울임</button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />
              <button type="button" onClick={() => insertFormatting('## ')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700" title="H2">H2</button>
              <button type="button" onClick={() => insertFormatting('### ')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700" title="H3">H3</button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />
              <button type="button" onClick={() => insertFormatting('> ')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700" title="인용구">💬 인용</button>
              <button type="button" onClick={() => insertFormatting('- ')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700" title="목록">• 목록</button>
            </div>

            {/* Right: Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={switchToVisual}
                style={{
                  backgroundColor: editorMode === 'visual' ? '#2563eb' : 'transparent',
                  color: editorMode === 'visual' ? '#ffffff' : '#94a3b8',
                  fontWeight: editorMode === 'visual' ? '800' : '600'
                }}
                className="px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👁️</span> 비주얼
              </button>
              <button
                type="button"
                onClick={switchToCode}
                style={{
                  backgroundColor: editorMode === 'code' ? '#2563eb' : 'transparent',
                  color: editorMode === 'code' ? '#ffffff' : '#94a3b8',
                  fontWeight: editorMode === 'code' ? '800' : '600'
                }}
                className="px-4 py-1.5 text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>&lt;/&gt;</span> 코드 (HTML)
              </button>
            </div>
          </div>

          {/* Visual Mode: 실제 이미지가 렌더링된 WYSIWYG 에디터 */}
          {editorMode === 'visual' && (
            <div
              ref={visualContentRef}
              contentEditable
              suppressContentEditableWarning
              style={{ backgroundColor: '#0f172a', color: '#f8fafc', outline: 'none' }}
              className="w-full p-8 font-sans text-base leading-relaxed focus:outline-none min-h-[500px] prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: rawContent }}
            />
          )}

          {/* Code Mode: [첨부 이미지 N] 태그로 경량화된 소스코드 에디터 */}
          {editorMode === 'code' && (
            <div className="relative">
              <div className="absolute top-3 right-4 text-xs text-blue-400 font-bold flex items-center gap-1 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/50 z-10">
                <span>🖼️</span> [첨부 이미지 N] = 원본 이미지 보존 위치
              </div>
              <textarea
                ref={textareaRef}
                rows={20}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="HTML 또는 마크다운 코드를 입력하세요..."
                style={{ backgroundColor: '#0f172a', color: '#38bdf8' }}
                className="w-full p-6 pt-12 text-sky-400 font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[500px]"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
