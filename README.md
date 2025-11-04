# 오프라인 이북 리더 PWA

인터넷 연결 없이도 도서를 읽을 수 있는 Progressive Web App (PWA) 이북 리더입니다.

## 주요 기능

### 📚 도서 관리
- **다양한 방식으로 도서 추가**: URL에서 다운로드, 텍스트 직접 입력, 파일 가져오기
- **IndexedDB 저장**: 브라우저 로컬 저장소에 안전하게 도서 저장
- **도서 내보내기**: 저장된 도서를 텍스트 파일로 다운로드

### 📖 독서 기능
- **폰트 크기 조절**: 12px ~ 32px 범위에서 자유롭게 조절
- **테마 변경**: 라이트, 다크, 세피아 모드 지원
- **줄 간격 및 글자 간격 조절**: 읽기 편한 환경 설정
- **페이지 네비게이션**: 버튼, 키보드, 터치 제스처로 페이지 이동
- **읽기 진행률 표시**: 현재 읽은 위치 시각적 표시

### 🎨 사용자 경험
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **다크 모드 자동 감지**: 시스템 설정에 따라 자동 적용
- **터치 제스처**: 스와이프로 페이지 이동
- **키보드 단축키**: Ctrl+/-, 방향키 등 지원
- **PWA 설치**: 앱처럼 설치하여 사용 가능

### 🔒 보안
- **Content Security Policy (CSP)**: XSS 공격 방어
- **입력 검증**: 사용자 입력 sanitization
- **HTTPS 전용**: 안전한 다운로드

### ♿ 접근성
- **ARIA 속성**: 스크린 리더 지원
- **키보드 네비게이션**: 마우스 없이 사용 가능
- **감소된 모션**: 애니메이션 민감도 대응
- **고대비 모드**: 시각 장애 대응

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: IndexedDB
- **PWA**: Service Worker, Web App Manifest
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Inter)

## 설치 방법

### 웹에서 사용
1. 브라우저에서 앱 URL 접속
2. 상단의 "설치" 버튼 클릭 또는 브라우저 메뉴에서 "앱 설치" 선택

### Android
1. Chrome 브라우저에서 접속
2. 메뉴 → "홈 화면에 추가" 선택

### iOS
1. Safari에서 접속
2. 공유 버튼 → "홈 화면에 추가" 선택

### PC (Windows/Mac/Linux)
1. Chrome 또는 Edge에서 접속
2. 주소창 우측의 설치 아이콘 클릭

## 사용 방법

### 도서 추가
1. 우측 상단의 "도서 관리" 버튼 클릭
2. 다음 중 하나를 선택:
   - **도서 다운로드**: URL 입력하여 텍스트 파일 다운로드
   - **텍스트 추가**: 제목과 내용을 직접 입력
   - **파일 가져오기**: 로컬 파일 선택 (구현 예정)

### 독서
- **폰트 크기**: 상단의 A⁻, ⟲, A⁺ 버튼 사용
- **페이지 이동**: 하단의 ← → 버튼 또는 좌우 스와이프
- **설정 변경**: 상단의 톱니바퀴 아이콘 클릭

### 키보드 단축키
- `Ctrl/Cmd + +`: 폰트 크기 증가
- `Ctrl/Cmd + -`: 폰트 크기 감소
- `Ctrl/Cmd + 0`: 폰트 크기 초기화
- `←`: 이전 페이지
- `→`: 다음 페이지
- `Esc`: 모달 닫기

## 개발 및 배포

### 로컬 개발
```bash
# 저장소 클론
git clone https://github.com/tassyhong-arch/2005idopress.git
cd 2005idopress

# 로컬 서버 실행 (Python 예시)
python -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000
```

### 배포
정적 파일만으로 구성되어 있어 다음 플랫폼에 쉽게 배포 가능:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

## 브라우저 지원

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Samsung Internet 14+

## 라이선스

MIT License

## 변경 이력

자세한 변경 이력은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.

## 기여

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 문의

이슈가 있거나 문의사항이 있으시면 GitHub Issues를 이용해주세요.
