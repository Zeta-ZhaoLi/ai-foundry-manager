# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Azure AI Foundry/OpenAI 환경에서 계정, 리전, 모델 선택, 배포 템플릿 내보내기를 관리하는 로컬 우선 대시보드입니다.

## 개요

- 순수 프론트엔드 앱(React + Vite), 백엔드 필수 아님
- 모든 데이터는 브라우저 `localStorage` 에 저장
- 민감 값은 로컬 저장 전에 암호화
- 멀티 계정/멀티 리전 운영에 최적화

## 핵심 기능

### 계정 및 리전 관리

- 계정 등급, 쿼터, 사용량 관리
- 계정별 다중 리전 구성
- 리전별 Foundry/OpenAI/AI Services/Anthropic 엔드포인트 설정
- 리전별 API Key 및 Resource Name 설정
- 활성화/비활성화 및 드래그 정렬

### 모델 관리

- 글로벌 마스터 모델 디렉터리
- 리전별 클릭 선택 + 검색/필터
- 커버리지 차트 및 모델 통계
- 모델 목록 빠른 복사

### 배포 템플릿 내보내기

- 리전 단위 모델 배포 테이블
- 편집 필드: 포함, 모델, 배포 이름, 버전, 용량
- 검증 후 ARM 템플릿 복사

### 생산성 및 프라이버시

- 커맨드 팔레트와 단축키
- 민감정보 마스킹을 위한 프라이버시 모드
- 구성 JSON 가져오기/내보내기
- 다크/라이트/시스템 테마 및 다국어 UI

## 빠른 시작

### 요구 사항

- Node.js 22.12+
- npm

### 설치

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### 개발 실행

```bash
npm run dev
```

기본 URL: `http://localhost:5174`

### 빌드 및 미리보기

```bash
npm run build
npm run preview
```

## 사용 흐름

1. **Global Model Directory** 에서 모델 목록 관리
2. 계정 생성 후 리전 추가
3. 리전별 Endpoint / API Key / Resource Name 입력
4. 배포 테이블 값 조정
5. 모델 목록 또는 배포 템플릿 복사

## 데이터 및 보안

- 주요 localStorage 키:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- API Key 등 민감 항목은 암호화 저장
- 프라이버시 모드로 화면 민감정보 마스킹

## 선택/내부 연동 참고

- 저장소에는 로컬 개발을 위한 선택/내부 연동 설정이 포함될 수 있습니다.
- 핵심 기능 사용에 백엔드 연결은 필요하지 않습니다.

## 지원 UI 언어

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## 개발 명령

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## 주요 구조

```text
src/
  components/      UI 및 대시보드 모듈
  hooks/           로컬 상태/저장 훅
  i18n/            다국어 리소스
  utils/           공통 유틸리티
  contexts/        React 컨텍스트
openspec/          변경 제안 및 스펙
```

## 라이선스

MIT License. `LICENSE` 참고.

## 작성자

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
