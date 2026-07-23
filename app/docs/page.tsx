import InfoPage from '@/app/_components/info-page'

export default function DocsPage() {
  return (
    <InfoPage title="문서">
      <p>DevFlow는 개발자가 소음 없이 기술 지식을 읽고, 쓰고, 공유할 수 있는 블로그입니다.</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>홈페이지 상단 검색창과 카테고리 필터로 원하는 글을 찾을 수 있습니다.</li>
        <li>이메일로 회원가입하면 게시글에 댓글을 남기고 좋아요를 누를 수 있습니다.</li>
        <li>로그인 후 헤더의 &quot;글쓰기&quot; 버튼으로 직접 글을 발행할 수 있습니다.</li>
      </ul>
    </InfoPage>
  )
}
