# 입단지원서 v2 적용 상태

2026-09-08: **홈페이지·CMS 코드와 실제 Supabase DB 반영 완료**.
SQL Editor에서 실제 테이블의 컬럼·필수 제약·상태·RLS를 확인한 뒤 호환 마이그레이션을 적용했다.
이전에 없던 `get_join_application_config`가 실제 GET 요청에 HTTP 200 / form_version 2를 반환한다.
익명 신청 기록 조회는 계속 거부된다.

## 포함된 변경

- 필수 7개 답변: 이름, 생년월일, 학교·학년, 본인 전화, 보호자 전화, 복수 지원 파트, 지원 동기.
- 별도 명시적 개인정보 동의. 이메일·사진을 임의 생성하거나 대신 동의하지 않음.
- 제출 전 확인, 수정, 중복 클릭 방지, 동일 요청 ID 재확인.
- 모집 시작/종료 한국 시간 입력 및 서버 접수 기간 검증.
- 기존 v1 신청·첨부·관리자 권한을 유지하고 v2 상세를 구분.
- 관리자 처리 상태를 실제 DB의 신규·연락 완료·오디션 안내·보류·처리 완료와 일치시킴. 보관 여부는 별도 유지.
- `/join`의 로딩/오류/지원서에 이전 Hero를 렌더링하지 않음.
- 기존 `/contact?section=join`은 새 지원서 경로로 이동.

## 적용 기록 및 재적용 주의

이 프로젝트에는 아래 SQL을 이미 1회 적용했다. **그대로 다시 실행하지 않는다.**
사전 검증이 이미 존재하는 v2 컬럼을 만나면 중단하는 것이 정상이다.
다른 환경에 적용할 때에만 다음 절차로 실제 스키마부터 대조한다.

1. 현재 홈페이지에 연결된 Supabase 프로젝트인지 공개 URL의 project ref와 대조한다.
2. `supabase/migrations/20260908_join_application_v2.sql`을 전체 검토한다.
3. 해당 SQL을 권한 있는 migration owner로 한 번 실행한다. 기존 레코드/Storage를 삭제하지 않는다.
   스크립트는 기존 컬럼·CHECK·RLS 정책이 예상과 다르면 트랜잭션을 중단한다.
   오류가 발생하면 임의로 제약/정책을 제거하지 말고 실제 스키마와 오류를 먼저 검토한다.
4. `node scripts/check-join-application-live.mjs`가 성공하는지 확인한다.
   공개 신청 기록 SELECT는 거부되어야 하며 새 config 함수는 form_version 2를 반환해야 한다.
5. 관리자 입단 안내에서 기존 본문이 보존되는지, 기간 입력이 한국 시간으로 보이는지 확인한다.
6. 기간은 운영자가 승인한 값만 설정한다. 기존 값이 모두 비어 있으면 상시 접수하며 임의의 시즌 문구를 표시하지 않는다.

## 검증 경계

- 실제 서버 DDL을 재현한 로컬 PostgreSQL(PGlite) 테스트 16개 통과.
- 실제 원격 DB에서 익명 역할의 신규 7항목 접수와 동일 UUID 재시도, 미동의 거부, 모집 기간 저장 및 기간 밖 신규 접수 거부를 트랜잭션 안에서 검증.
- 기존 요청은 기간 밖에도 성공 여부를 재확인할 수 있음을 검증.
- 검증 트랜잭션은 ROLLBACK 처리했다. 테스트 기록 0건, 기존 신청 건수·내용 및 안내 내용의 요약값이 변경 전과 같음을 확인.
- 브라우저의 최종 제출 동작은 가로챈 테스트 응답으로 검증하며, 실제 사이트에서 운영 신청서를 제출하지 않음.
- 관리자 개인 계정으로 로그인한 실제 화면 저장 조작은 별도로 수행하지 않음. CMS 저장 변환/검증과 DB 제약을 각각 검사.
- 프론트엔드는 서버 버전 확인 실패를 접수 성공으로 표시하지 않음.

공식 기준: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions),
[PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html),
[MDN datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local).
