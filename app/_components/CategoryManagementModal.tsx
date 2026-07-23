'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Category {
  id: number
  name: string
  slug: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onCategoriesUpdated: () => void
}

function generateSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
  return clean || `cat-${Date.now()}`
}

export default function CategoryManagementModal({ isOpen, onClose, onCategoriesUpdated }: Props) {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setErrorMsg(null)
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      setErrorMsg('카테고리 목록을 불러오지 못했습니다: ' + error.message)
    } else if (data) {
      setCategories(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setNewCatName('')
      setEditingId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // 1. 카테고리 추가
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const slug = generateSlug(newCatName)
    setErrorMsg(null)
    setLoading(true)

    const { error } = await supabase
      .from('blog_categories')
      .insert([{ name: newCatName.trim(), slug }])

    if (error) {
      setErrorMsg('카테고리 추가 실패: ' + error.message)
    } else {
      setNewCatName('')
      await fetchCategories()
      onCategoriesUpdated()
    }
    setLoading(false)
  }

  // 2. 카테고리 수정 저장
  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return
    setErrorMsg(null)
    setLoading(true)

    const { error } = await supabase
      .from('blog_categories')
      .update({ name: editingName.trim() })
      .eq('id', id)

    if (error) {
      setErrorMsg('카테고리 수정 실패: ' + error.message)
    } else {
      setEditingId(null)
      setEditingName('')
      await fetchCategories()
      onCategoriesUpdated()
    }
    setLoading(false)
  }

  // 3. 카테고리 삭제
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`'${name}' 카테고리를 정말 삭제하시겠습니까?`)) return

    setErrorMsg(null)
    setLoading(true)

    // 카테고리 릴레이션 삭제 후 본체 삭제
    await supabase.from('blog_post_categories').delete().eq('category_id', id)
    const { error } = await supabase.from('blog_categories').delete().eq('id', id)

    if (error) {
      setErrorMsg('카테고리 삭제 실패: ' + error.message)
    } else {
      await fetchCategories()
      onCategoriesUpdated()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <h3 className="text-base font-extrabold text-slate-900">블로그 카테고리 관리</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* 추가 폼 */}
          <form onSubmit={handleAddCategory} className="space-y-2">
            <label className="text-xs font-bold text-slate-700">➕ 새 카테고리 추가</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="예: AI/LLM, K-Food, 부동산..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !newCatName.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                추가
              </button>
            </div>
          </form>

          {/* 카테고리 리스트 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              📋 현재 등록된 카테고리 목록 ({categories.length}개)
            </label>

            {loading && categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                카테고리를 불러오는 중...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                등록된 카테고리가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/30">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    {editingId === cat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 text-xs px-3 py-1.5 bg-white border border-indigo-400 rounded-lg focus:outline-none text-slate-800 font-medium"
                        />
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({cat.slug})</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingId(cat.id)
                              setEditingName(cat.name)
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
