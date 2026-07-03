# Home V6 QA

## 명령 검증

- `pnpm lint`: 통과
- `pnpm build`: 통과

## 브라우저 검증

URL: `http://127.0.0.1:5175/`

| 항목 | 결과 |
|---|---|
| desktop 1440x900 로드 | 통과 |
| mobile 390x844 로드 | 통과 |
| 첫 카드 문구 잘림 | 해결 |
| 공연 패널 데스크탑 비율 | 해결 |
| 공연 패널 클릭 고정 | 통과 |
| 공연 패널 열린 상태 텍스트 겹침 | 해결 |
| 모바일 horizontal overflow | 0 |
| 중앙 book spine DOM | 0 |
| 콘솔 error/warn | 없음 |

## 보안 점검

- 실제 Supabase URL/key/password/token 문자열은 변경 파일에 추가하지 않았다.
- `.env.local`은 건드리지 않았다.
- `service_role`은 문서 경고 문구로만 존재하며 프론트엔드 코드에 추가하지 않았다.

## 남은 리스크

- 실제 iOS Safari/Android Chrome 기기에서는 추가 확인이 필요하다.
- 전체 40개 레퍼런스 중 이번 턴에서 직접 접속 확인한 것은 10개다.

