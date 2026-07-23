import InfoPage from '@/app/_components/info-page'

const ENTRIES = [
  {
    version: 'v0.3.0',
    items: ['게시글 작성 페이지(/write) 추가', '좋아요·댓글 삭제 기능 추가', '로그인 상태를 반영하는 헤더'],
  },
  {
    version: 'v0.2.0',
    items: ['게시글 상세페이지(/posts/[id]) 추가', '댓글 기능 추가'],
  },
  {
    version: 'v0.1.0',
    items: ['홈페이지 출시 (카테고리 필터, 검색, 페이지네이션)', '이메일 로그인/회원가입/로그아웃'],
  },
]

export default function ChangelogPage() {
  return (
    <InfoPage title="변경 내역">
      <div className="space-y-8">
        {ENTRIES.map((entry) => (
          <div key={entry.version}>
            <h2 className="text-sm font-bold text-[var(--primary)] mb-2">{entry.version}</h2>
            <ul className="list-disc pl-5 space-y-1">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </InfoPage>
  )
}
