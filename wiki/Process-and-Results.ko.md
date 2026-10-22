# 소스, 배포와 검증

<!-- language-navigation:start -->
<p dir="ltr">
<a href="Process-and-Results.md" lang="en" dir="ltr">English</a>
<a href="Process-and-Results.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="Process-and-Results.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="Process-and-Results.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="Process-and-Results.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="Process-and-Results.es.md" lang="es" dir="ltr">Español</a>
<a href="Process-and-Results.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="Process-and-Results.fr.md" lang="fr" dir="ltr">Français</a>
<a href="Process-and-Results.he.md" lang="he" dir="rtl">עברית</a>
<a href="Process-and-Results.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="Process-and-Results.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="Process-and-Results.it.md" lang="it" dir="ltr">Italiano</a>
<a href="Process-and-Results.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="Process-and-Results.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="Process-and-Results.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="Process-and-Results.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="Process-and-Results.pt.md" lang="pt" dir="ltr">Português</a>
<a href="Process-and-Results.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="Process-and-Results.th.md" lang="th" dir="ltr">ไทย</a>
<a href="Process-and-Results.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="Process-and-Results.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="Process-and-Results.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="Process-and-Results.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="Process-and-Results.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[위키 홈](Home.md)

공개 저장소 `speeddial`은 두 앱 에디션, 테스트, 일반 배포 예시와 문서를 포함합니다. 새로운 Git 이력과 합성 테스트 데이터로 시작합니다. 비공개 운영 아카이브는 과거 자료와 복구 기록을 유지하며, 앱 코드를 복제하지 않고 고정한 공개 소스 리비전이나 불변 이미지를 사용합니다.

[브라우저 로컬 앱](https://speeddial.alvit.here.now/)은 방문자마다 빈 보드로 시작합니다. 코드 공개는 개인 링크나 스크린샷을 다른 브라우저에 복사하지 않습니다. [백업 스크립트](../docs/browser-backups.ko.md)는 대상 구조 사본과 복원 후 정확한 내용 비교를 포함한 의도적 이전을 안내합니다.

## 배포 절차

![소스 검증, 격리된 복원 연습, 배포와 수용 검증은 별도 단계입니다.](images/release-process.svg)

서버 에디션은 Node.js, Docker와 k3s를 계속 지원합니다. 공개 리비전을 고정하고 검증한 불변 이미지를 빌드하거나 선택하며, 비공개 설정은 저장소 밖에서 적용하세요. 자격 증명과 영구 데이터 볼륨을 앱 이미지와 분리하세요. 기존 설치 이전에는 [전환 및 롤백 가이드](../deploy/README.md)를 사용하세요.

## 저장소와 데이터 경계

![공개 앱 소스는 비공개 배포를 지원하며 개인 브라우저 데이터와 서버 복구 기록은 비공개로 유지됩니다.](images/release-results.svg)

공개 소스에 개인 초기 보드는 없습니다. 로컬 브라우저 백업은 Git이 무시하는 `backups/`에 남습니다. 서버 복구 세트는 SQLite, 참조 이미지 파일과 별도 보호 자격 증명을 포함합니다. 서로 다른 에디션용 형식으로 상호 교환할 수 없습니다.

## 검증

로컬 및 CI 검사는 합성 테스트 데이터와 실행하는 시나리오를 검증합니다. 두 에디션 모두 다섯 언어, 접힌 컨트롤, 쌍별 교환, 포인터를 따르는 미리보기, 격자 크기와 기본적으로 같은 창에서의 탐색을 유지합니다.

서버 이전 연습은 ID, 순서, 제목, URL, 설정, 이미지 참조와 SQLite 무결성을 비교합니다. 교체 검사는 재시작 후 이전 세션이 실패하는지 확인합니다. 실제 배포 수용 검증은 대상 환경의 의도한 라우팅, 자격 증명, 이미지 가용성과 데이터 보존도 확인합니다.

소스 검사를 통과해도 배포나 복원이 이루어졌음을 증명하지는 않습니다. 실제 배포 영수증과 개인 목록은 비공개로 보관하세요. 다이어그램은 아키텍처와 절차를 설명하며 성능, 가용성이나 복구 시간을 보장하지 않습니다. 공개 소스는 `UNLICENSED`로 유지됩니다.
