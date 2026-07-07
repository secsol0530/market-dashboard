증시브리핑 자동 대시보드
지수·환율·섹터 대표종목 등락을 평일 장중 30분 간격으로 자동 수집해 언제든 웹으로 확인하는 정적 대시보드.
원인 해석/수급/투자전략은 포함하지 않음 (규칙기반, 무료 운영 목적).
구성
코드
배포 방법 (무료, GitHub Pages 기준)
기존 Netlify Drop 방식과 달리, 자동 갱신을 위해 GitHub 저장소가 필요합니다
(Netlify Drop은 매번 수동 업로드라 자동화 불가).
GitHub에 새 저장소 생성 (예: market-dashboard), 이 폴더 전체를 push
저장소 Settings → Pages → Source를 main 브랜치로 설정
Settings → Actions → General → Workflow permissions에서
"Read and write permissions" 선택 (자동 커밋 위해 필요)
Actions 탭 → update-market-briefing → Run workflow로 1회 수동 실행해 정상 동작 확인
이후 평일 09:00~15:30(KST) 30분 간격 자동 실행됨
https://<계정명>.github.io/market-dashboard/ 접속 시 언제든 최신 데이터 확인 가능
주의사항 (신뢰도 관련)
KOSPI/KOSDAQ 지수, 환율: Naver 실시간 시세 API, open.er-api.com(무료 환율 API) 사용.
이 코드는 네트워크가 차단된 환경에서 작성되어 실제 호출 테스트를 하지 못했습니다.
최초 배포 후 Actions 로그와 data/briefing.json 내용을 반드시 확인하세요.
섹터: config.json에 지정한 대표종목 2~3개의 평균 등락률로만 표시.
실제 업종 지수(KRX 기준)와는 다를 수 있음. 특히 "물리적AI", "양자"는
테마 성격상 확정된 대표종목이 없어 임의로 넣었으니 직접 교체 권장.
수급(개인/외국인/기관/연기금): 무료 API로 안정적 수집이 어려워 이번 버전에는 미포함.
필요 시 채팅으로 요청하는 기존 방식 병행 권장.
뉴스 해석/전략: 의도적으로 제외 (요청하신 대로 비용 없는 규칙기반 버전).
해석이 필요하면 기존처럼 채팅에서 "브리핑" 요청 방식을 계속 사용하는 것이 정확도가 높음.
종목/섹터 코드 수정
config.json의 sectors 값(6자리 종목코드 배열)을 편집 후 다시 push하면
다음 실행부터 반영됩니다.
