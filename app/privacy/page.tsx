import InfoPage from '@/app/_components/info-page'

export default function PrivacyPage() {
  return (
    <InfoPage title="개인정보 처리방침">
      <p>DevFlow는 회원가입 및 로그인을 위해 이메일 주소를 수집하며, 인증은 Supabase Auth를 통해 처리됩니다.</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>수집 항목: 이메일 주소, 비밀번호(암호화 저장), 로그인 세션 쿠키</li>
        <li>이용 목적: 회원 인증, 댓글·좋아요·게시글 작성자 식별</li>
        <li>보관 기간: 회원 탈퇴 시까지</li>
        <li>제3자 제공: 별도의 광고·분석 목적의 제3자 제공은 없습니다.</li>
      </ul>
      <p className="text-xs text-zinc-400">본 페이지는 데모 프로젝트용 안내이며, 실제 서비스 운영 시에는 법률 검토가 필요합니다.</p>
    </InfoPage>
  )
}
