# 변경 이력 (Changelog)

## [2.0.0] - 2025-11-04

### 추가됨 (Added)
- **JavaScript 파일 전체 구현**
  - `js/app.js`: 앱 초기화 및 전역 상태 관리
  - `js/reader.js`: 독서 기능 (폰트 조절, 페이지 네비게이션, 설정)
  - `js/storage.js`: IndexedDB를 사용한 로컬 저장소 관리
  - `js/download.js`: 도서 다운로드 및 가져오기 기능
  - `js/book-manager.js`: 도서 관리 UI
  - `js/pwa.js`: PWA 기능 (Service Worker, 설치 프롬프트)
  - `js/responsive.js`: 반응형 디자인 및 모바일 최적화

- **CSS 파일 추가**
  - `css/responsive.css`: 반응형 디자인 스타일시트

- **보안 강화**
  - Content Security Policy (CSP) 헤더 추가
  - XSS 방지를 위한 입력 sanitization
  - HTTPS 전용 다운로드 제한

- **접근성 개선**
  - ARIA 속성 추가 (aria-label, aria-modal, role 등)
  - 키보드 네비게이션 지원
  - 스크린 리더 지원
  - 감소된 모션 설정 지원

- **기능 추가**
  - 터치 제스처 (스와이프) 지원
  - 시스템 다크 모드 자동 감지
  - 백그라운드 동기화
  - 푸시 알림 지원
  - 도서 내보내기 기능
  - 저장소 사용량 표시

### 수정됨 (Fixed)
- CSS 구문 오류 수정 (중복 중괄호 제거)
- Service Worker 캐시 경로 수정
- 외부 리소스 로딩 최적화

### 개선됨 (Improved)
- Service Worker 캐싱 전략 개선 (캐시 우선 + 백그라운드 업데이트)
- 에러 처리 강화
- 코드 모듈화 및 구조 개선
- 성능 최적화 (스크롤, 리사이즈 디바운싱)
- 모바일 UX 개선

### 보안 (Security)
- CSP 정책 적용으로 XSS 공격 방어
- 사용자 입력 검증 및 sanitization
- 파일 크기 및 타입 제한
- HTTPS 전용 다운로드

## [1.0.0] - 이전 버전
- 기본 HTML 구조
- 기본 CSS 스타일
- Service Worker 기본 구조
- PWA manifest
