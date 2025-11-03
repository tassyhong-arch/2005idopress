# 📚 2005idopress - 오프라인 이북 리더 PWA

Google Drive 문서의 텍스트를 기반으로 제작된 **모바일/태블릿/데스크톱** 모든 디바이스에 최적화된 이북 리더입니다.

인터넷 없이도 도서를 읽을 수 있는 **Progressive Web App(PWA)** 기반 이북 리더입니다. 온라인 상태에서 도서를 다운로드하여 오프라인에서 언제든지 읽을 수 있습니다.

## ✨ 주요 기능

### 📱 PWA (Progressive Web App)
- **오프라인 작동**: 인터넷 없이도 저장된 도서 읽기
- **앱 설치**: 홈화면에 추가하여 네이티브 앱처럼 사용
- **백그라운드 동기화**: 온라인이 될 때 자동 동기화
- **푸시 알림**: 새 도서 알림 (선택적)
- **자동 업데이트**: 새 버전 자동 감지 및 업데이트

### 📚 도서 관리
- **도서 다운로드**: URL에서 직접 도서 다운로드
  - 일반 텍스트 파일 (.txt)
  - Google Docs 공개 링크 지원
  - JSON 파일 지원
- **텍스트 추가**: 클립보드에서 도서 내용 직접 추가
- **파일 업로드**: 로컬 파일 업로드 (최대 10MB)
- **여러 도서 관리**: IndexedDB를 사용한 여러 권의 도서 저장
- **저장소 관리**: 100MB 저장소 자동 관리
- **도서 전환**: 저장된 도서 간 쉽게 전환
- **도서 삭제**: 개별 도서 삭제 기능

### 🌐 온라인/오프라인 상태
- **자동 감지**: 온라인/오프라인 상태 실시간 표시
- **스마트 동기화**: 온라인일 때 자동 동기화
- **오프라인 알림**: 인터넷 연결 없이도 도서 읽기 가능
- **상태 인디케이터**: 현재 연결 상태 시각적 표시

### 📖 독서 기능
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화
  - 모바일 (최대 480px): 작은 화면 최적화
  - 태블릿 (481px - 768px): 중간 화면 최적화
  - 데스크톱 (769px 이상): 큰 화면 최적화
- **폰트 크기 조정**: A⁻, A⁺, ⟲ 버튼으로 실시간 조정
  - 버튼 조정: 화면의 A⁻, A⁺, ⟲ 버튼 클릭
  - 키보드 단축키: `+`, `-`, `0` 키
  - 범위: 12px ~ 24px
- **테마 지원**: 라이트, 다크, 세피아 모드
  - 라이트 모드: 밝은 배경, 기본 테마
  - 다크 모드: 어두운 배경, 눈의 피로 감소
  - 세피아 모드: 종이책 같은 느낌
- **읽기 위치 추적**: 정확한 읽기 위치 저장 및 복원
  - 도서별 읽기 위치 자동 저장
  - 앱 재실행 시 마지막 위치로 자동 이동
  - 스크롤 진행률 표시 (%)
- **페이지네이션**: 자동 페이지 분할 및 네비게이션
  - 이전/다음 페이지 버튼
  - 현재 페이지 / 전체 페이지 표시
  - 키보드 화살표 키로 페이지 이동
- **줄 간격 조절**: 좁게, 보통, 넓게, 매우 넓게
- **글자 간격 조절**: 보통, 넓게, 매우 넓게
- **스와이프 제스처**: 모바일에서 좌우 스와이프로 페이지 이동
- **더블 탭**: 폰트 크기 초기화

### 🎯 추가 기능
- **스크롤 진행 바**: 상단에 읽기 진행 상태 표시
- **실시간 알림 시스템**: 사용자 액션 피드백
- **자동 설정 저장**: 사용자 설정 자동 저장
- **디바이스 감지**: 자동 디바이스 타입 감지 및 최적화
- **방향 변경 감지**: 화면 회전 시 자동 재조정
- **저장소 통계**: 사용 중인 저장 공간 및 남은 공간 표시

## 🚀 시작하기

### 1. 웹 브라우저에서 열기
1. **index.html** 파일을 웹 브라우저에서 열기
2. 또는 웹 서버에서 호스팅
3. 자동으로 기본 콘텐츠가 로드됩니다

### 2. 앱 설치 (권장)
- **안드로이드 Chrome**: 
  - 주소창의 "앱 설치" 버튼 클릭
  - 또는 메뉴 → "홈 화면에 추가"
- **iOS Safari**: 
  - 공유 버튼 → "홈 화면에 추가"
- **데스크톱**: 
  - Chrome: 주소창 오른쪽 설치 아이콘
  - Edge: 주소창 오른쪽 앱 아이콘

### 3. 도서 추가하기

#### 방법 1: URL에서 다운로드
1. 도서 관리 버튼 (📚) 클릭
2. "도서 다운로드" 버튼 클릭
3. 텍스트 파일 URL 입력
   - 예: `https://example.com/book.txt`
   - Google Docs: 공개 링크 입력 (자동 변환)
4. 도서 제목 입력 (선택사항)
5. 다운로드 완료 대기

#### 방법 2: 텍스트 직접 추가
1. 도서 관리 버튼 (📚) 클릭
2. "텍스트 추가" 버튼 클릭
3. 도서 제목 입력
4. 내용 입력 또는 붙여넣기
5. 확인

#### 방법 3: 파일 업로드 (향후 추가 예정)
- 로컬 텍스트 파일 업로드

## 📱 사용 방법

### 독서 컨트롤
- **폰트 크기**:
  - `A⁻` 버튼 또는 `-` 키: 폰트 크기 축소
  - `A⁺` 버튼 또는 `+` 키: 폰트 크기 확대
  - `⟲` 버튼 또는 `0` 키: 기본 크기로 초기화
- **페이지 이동**:
  - `◀` 버튼 또는 `←` 키: 이전 페이지
  - `▶` 버튼 또는 `→` 키: 다음 페이지
  - 모바일: 좌우 스와이프
- **테마 변경**:
  - 설정 버튼 (⚙️) → 테마 선택
- **줄/글자 간격**:
  - 설정 버튼 (⚙️) → 원하는 간격 선택

### 도서 관리
- **도서 목록 보기**: 도서 관리 버튼 (📚) 클릭
- **도서 읽기**: 목록에서 "읽기" 버튼 클릭
- **도서 삭제**: 휴지통 아이콘 (🗑️) 클릭
- **저장소 통계**: "저장소 통계" 버튼으로 사용량 확인

## 🛠️ 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 
  - CSS Variables (테마)
  - Flexbox & Grid (레이아웃)
  - Media Queries (반응형)
  - Transitions & Animations
- **JavaScript (ES6+)**:
  - 모듈화된 클래스 구조
  - Async/Await
  - Event Delegation
  - Debouncing & Throttling

### PWA 기술
- **Service Worker**: 오프라인 캐싱 및 백그라운드 동기화
- **Web App Manifest**: 앱 설치 및 메타데이터
- **IndexedDB**: 도서 저장 및 관리
- **Cache API**: 정적 리소스 캐싱
- **Background Sync**: 온라인 시 자동 동기화
- **Push Notifications**: 알림 기능

### 저장소
- **LocalStorage**: 설정 및 읽기 위치 저장
- **IndexedDB**: 도서 콘텐츠 저장 (최대 100MB)
- **Cache Storage**: Service Worker 캐싱

## 📂 프로젝트 구조

```
2005idopress/
├── index.html              # 메인 HTML 파일
├── manifest.json           # PWA 매니페스트
├── sw.js                   # Service Worker
├── content.txt             # 기본 콘텐츠 샘플
├── css/
│   ├── style.css          # 기본 스타일
│   └── responsive.css     # 반응형 스타일
└── js/
    ├── app.js             # 앱 초기화 및 설정
    ├── reader.js          # 이북 리더 핵심 기능
    ├── responsive.js      # 반응형 디자인 관리
    ├── storage.js         # IndexedDB 저장소 관리
    ├── download.js        # 도서 다운로드 기능
    ├── book-manager.js    # 도서 관리 UI
    └── pwa.js             # PWA 기능 관리
```

## 🔧 개발 환경 설정

### 로컬 개발 서버 실행
```bash
# Python을 사용하는 경우
python -m http.server 8000

# Node.js를 사용하는 경우
npx http-server -p 8000

# 브라우저에서 열기
# http://localhost:8000
```

### HTTPS로 테스트 (PWA 기능 전체 테스트)
```bash
# ngrok 사용 (권장)
npx ngrok http 8000
```

## 🌟 브라우저 지원

### 완전 지원
- ✅ Chrome/Edge 90+
- ✅ Safari 14+ (iOS 14+)
- ✅ Firefox 88+

### 부분 지원
- ⚠️ Samsung Internet 14+
- ⚠️ Opera 76+

### PWA 기능별 지원
| 기능 | Chrome | Safari | Firefox |
|------|--------|--------|---------|
| Service Worker | ✅ | ✅ | ✅ |
| 앱 설치 | ✅ | ✅ | ⚠️ |
| Background Sync | ✅ | ❌ | ❌ |
| Push Notifications | ✅ | ✅ (iOS 16.4+) | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |

## 📝 저장소 제한

- **전체 저장소**: 최대 100MB
- **개별 도서**: 최대 10MB (업로드)
- **도서 수**: 제한 없음 (저장소 용량 내)

## 🐛 알려진 이슈

1. **iOS Safari**:
   - Background Sync 지원 안 됨
   - 일부 제스처가 브라우저 기본 동작과 충돌 가능
   
2. **Firefox**:
   - 앱 설치 기능 제한적
   - beforeinstallprompt 이벤트 미지원

3. **일반**:
   - 매우 큰 파일(>10MB) 다운로드 시 성능 저하 가능

## 🔐 개인정보 보호

- **로컬 저장**: 모든 데이터는 사용자 기기에만 저장됩니다
- **서버 전송 없음**: 도서 콘텐츠는 서버로 전송되지 않습니다
- **추적 없음**: 사용자 추적 또는 분석 코드 없음
- **오픈소스**: 코드는 완전히 공개되어 있습니다

## 📄 라이선스

MIT License

Copyright (c) 2024 2005idopress

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🤝 기여하기

기여는 언제나 환영합니다! 다음 방법으로 기여할 수 있습니다:

1. 이슈 제출: 버그 리포트 또는 기능 제안
2. Pull Request: 코드 개선 또는 새 기능 추가
3. 문서화: README 또는 코드 주석 개선
4. 번역: 다국어 지원 추가

### 기여 가이드라인
1. Fork 프로젝트
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📧 연락처

프로젝트 링크: [https://github.com/tassyhong-arch/2005idopress](https://github.com/tassyhong-arch/2005idopress)

## 🙏 감사의 말

- [Font Awesome](https://fontawesome.com/) - 아이콘
- [Google Fonts](https://fonts.google.com/) - Inter 폰트
- 모든 오픈소스 기여자들

---

**2005idopress** - 언제 어디서나 책을 읽으세요! 📚✨
