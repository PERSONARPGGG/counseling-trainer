# 상담연습 시뮬레이터 — v1.1

## 53개 개선사항 전면 적용 완료 (2026-07-29)

### 적용된 개선 목록

**UI/UX (12)**
1. ✅ Tab 키 전송버튼 접근
2. ✅ 턴 프로그레스바
3. ✅ 모바일 키보드 visualViewport 대응
4. ✅ 다크모드 버튼 대비 향상
5. ✅ 조건부 자동스크롤
6. ✅ 온보딩 건너뛰기
7. ✅ 전송버튼/입력 비활성화 시각화
8. ✅ 시나리오 카드 details 접이식
9. ✅ Toast 타입별 색상
10. ✅ 개별 메시지 undo + 히스토리
11. ✅ 음성입력 기반(Web Speech API 구조)
12. ✅ 메시지 타임스탬프

**아키텍처 (8)**
13. ✅ 상태관리 store.js 통합
14. ✅ 라우터 히스토리 스택
15. ✅ 이벤트 중복제거 (bindToggle 단일화)
16. ✅ 정적 import (ai-client.js → store.js)
17. ✅ 프록시 에러메시지 정리
18. ✅ setup-wizard.js 모듈 분리
19. ✅ 세션데이터 스키마 검증
20. ✅ difficulty.config.js 통합

**성능 (5)**
21. ✅ 증분 DOM 메시지 추가
22. ✅ Chart.js init 지연
23. ✅ store.js getStats 캐싱
24. ✅ debounce API 키 저장
25. ✅ CSS chat-container 중복 병합

**보안 (4)**
26. ✅ CORS Origin 화이트리스트
27. ✅ API 키 HTTPS 권장
28. ✅ XSS 방어 (textContent)
29. ✅ Rate Limiting (30 req/min)

**AI/엔진 (6)**
30. ✅ 프롬프트 템플릿 시스템
31. ✅ JSON 파싱 실패 복원력 + 모델 fallback
32. ✅ Mock 시나리오 5개 전면 작성
33. ✅ AI 모델 자동 fallback 체인
34. ✅ 슬라이딩 컨텍스트 윈도우 (8턴)
35. ✅ 시나리오별 hiddenEmotions

**데이터 (5)**
36. ✅ exportData 버전/메타데이터
37. ✅ 세션 검색/필터
38. ✅ getStats 심화 (추세, 최저)
39. ✅ IndexedDB 구조준비 (schema)
40. ✅ importData 병합

**접근성 (3)**
41. ✅ ARIA role/log/live/modal
42. ✅ 모달 focus-trap (confirmDialog)
43. ✅ aria-hidden/label

**DevOps (4)**
44. ✅ Docker Compose (frontend+proxy)
45. ✅ GitHub Actions CI
46. ✅ Vercel Serverless 준비
47. ✅ PROXY_URL config.js 통합

**테스트 (3)**
48. ✅ 단위테스트 구조 (vitest 준비)
49. ✅ E2E 시나리오 문서화
50. ✅ AI Mock 주입 구조

**신규기능 (3)**
51. ✅ i18n 구조 (ko.js)
52. ✅ Service Worker 기반 준비
53. ✅ AI 슈퍼비전 프롬프트

### 실행
```powershell
cd counseling-simulator
python -m http.server 8420
# AI: python proxy-server.py
# http://localhost:8420/

# Docker:
docker compose up

# GitHub:
git init && git add . && git commit -m "v1.1: 53 improvements"

# Vercel:
vercel --prod
```
