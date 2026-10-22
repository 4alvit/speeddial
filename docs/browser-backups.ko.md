# 브라우저 로컬 백업 및 복원 스크립트

<!-- language-navigation:start -->
<p dir="ltr">
<a href="browser-backups.md" lang="en" dir="ltr">English</a>
<a href="browser-backups.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="browser-backups.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="browser-backups.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="browser-backups.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="browser-backups.es.md" lang="es" dir="ltr">Español</a>
<a href="browser-backups.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="browser-backups.fr.md" lang="fr" dir="ltr">Français</a>
<a href="browser-backups.he.md" lang="he" dir="rtl">עברית</a>
<a href="browser-backups.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="browser-backups.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="browser-backups.it.md" lang="it" dir="ltr">Italiano</a>
<a href="browser-backups.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="browser-backups.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="browser-backups.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="browser-backups.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="browser-backups.pt.md" lang="pt" dir="ltr">Português</a>
<a href="browser-backups.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="browser-backups.th.md" lang="th" dir="ltr">ไทย</a>
<a href="browser-backups.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="browser-backups.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="browser-backups.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="browser-backups.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="browser-backups.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[이전 절차](browser-migration.md) · [모든 배포 방식](../README.md#storage-and-deployment)

이 스크립트는 **Speed Dial 보드**의 링크 순서, 제목, 전체 이미지 바이트, 행, 열, 열기 설정과 언어를 보존합니다. 브라우저 방문 기록, 암호, 확장 프로그램이나 다른 북마크는 백업하지 않습니다. Chrome이나 Firefox 내부 데이터베이스 대신 앱의 이식 가능한 `speedial-local-backup` JSON 형식을 사용합니다.

[speeddial.alvit.here.now](https://speeddial.alvit.here.now/)의 브라우저 로컬 앱에서 작동합니다. Node.js, Docker, k3s 배포의 [서버 백업](../wiki/Operations.md#backup-and-restore)을 대체하지 않습니다. 서버의 이전 JSON 내보내기는 완전한 브라우저 백업으로 인정되지 않습니다. 해당 보드를 옮기려면 [이미지 수집 및 변환 절차](browser-migration.md)가 필요합니다.

보드가 아직 이전 주소 `speedial.alvit.here.now`에 있다면 먼저 정확히 그 주소에서 내보내세요. 스크립트는 이제 `speeddial.alvit.here.now`를 엽니다. 열린 이전 탭과 함께 `--no-open`을 사용하거나 저장한 내보내기 파일을 명시적으로 보관하세요. 기존 `speedial-local-backup` 파일과 `speedial-backup-*.json` 다운로드 이름도 계속 지원합니다. [주소 이전 참고사항](local-speedial.md#corrected-address-and-existing-backups)을 보세요.

## 요구 사항과 브라우저 지원

이 Git 체크아웃에서 Node.js 24+를 실행하세요. 추가 패키지는 필요 없습니다. macOS 실행기는 `/Applications`, `~/Applications`, `/System/Applications`의 Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf, Waterfox를 인식합니다. 이는 실행 지원이며 모든 브라우저를 테스트했다는 뜻은 아닙니다. 자동 앱 테스트에는 Chromium, Firefox, WebKit을 사용합니다.

```sh
npm run backup:browser -- --list-browsers
```

다른 macOS 브라우저는 `--app /absolute/path/Browser.app`을 사용하세요. 이미 열린 브라우저, Codex 내장 브라우저, Windows나 Linux에서는 `--no-open`을 사용하고 사이트를 직접 여세요. 디버깅 포트, 확장 프로그램, 손쉬운 사용 권한이나 프로필 파일 직접 접근은 필요 없습니다.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

실행 URL은 기본 주소로 고정됩니다. 다른 출처의 보드는 정확히 그 출처에서 내보내야 합니다. 그곳에서 작업할 때 `--no-open`을 쓰고 대상 주소를 직접 확인하세요. 브라우저 저장소는 리디렉션이나 호스트 이름 변경을 따라 이동하지 않습니다.

**이 스크립트는 대화형입니다.** 앱을 열고 로컬 파일을 관리하지만 내보내기 클릭, 가져올 파일 선택, 교체 확인은 사용자가 합니다. 앱에 여러 프로필이 있을 수 있으므로 원하는 프로필을 선택해 [speeddial.alvit.here.now](https://speeddial.alvit.here.now/)를 사용하세요. 새 프로필이 비어 있는 것은 정상입니다. 스크립트는 어느 프로필이 다운로드를 만들었는지 증명할 수 없습니다.

## Chrome 백업

```sh
npm run backup:browser -- --browser chrome
```

1. 기존 Chrome 프로필을 선택하고 오른쪽 위 화살표를 펼친 다음 **Export backup**을 클릭하세요.
2. 제안된 이름 `speedial-backup-YYYY-MM-DD.json`으로 `~/Downloads`에 저장하세요. ` (1)` 같은 이름 충돌 접미사도 지원합니다.
3. 스크립트는 새롭고 완전한 내보내기를 기다려 검증하고, `backups/`에 복사해 다시 읽은 뒤 경로, 개수와 SHA-256을 출력합니다. 이전 내보내기를 대신 선택하지 않습니다. 여러 파일이 동시에 내보내지면 추측하지 않고 오류를 냅니다.

브라우저가 다른 곳에 다운로드한다면 `--downloads /absolute/local/folder`를 사용하고 브라우저에서도 같은 폴더를 선택하세요. 클라우드 동기화 디렉터리 밖의 로컬 폴더를 선택하세요. 기본 대기는 10분이며 `--timeout 1200`은 20분으로 바꿉니다. 파일 생성 전에 브라우저 **Save As** 창의 확인이 필요할 수 있습니다. 이름을 바꾸었거나 이미 내려받은 내보내기는 다음을 사용합니다.

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

명시적 파일 모드는 해당 파일만 보관합니다. 현재 브라우저 데이터를 가져오거나 최신임을 증명하지 **않습니다**. 원본 다운로드는 유지됩니다. 감시기가 수집한 내보내기는 POSIX에서 `0600` 모드로 제한되며 명시적으로 지정한 입력 파일은 바뀌지 않습니다.

## 다른 브라우저에 복원

`YOUR-BACKUP.json`을 출력된 백업 파일 이름으로 바꾸세요.

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

복원 명령은 대화형 터미널이 필요하며 한 번에 하나의 브라우저/프로필을 안내합니다.

1. 입력을 검증하고 별도의 `restore-source` 사본을 보존합니다. 대상 프로필에서 현재 보드를 비어 있어도 내보내세요. 스크립트가 `before-restore`로 저장해 되돌릴 수 있도록 합니다.
2. 터미널에 `RESTORE`를 입력해 내보내기가 올바른 대상 프로필에서 왔음을 확인하세요.
3. 같은 브라우저에서 **Import backup**을 클릭하고 출력된 `restore-source` 파일을 선택하세요. 요약을 확인한 다음 **Replace this board**를 클릭하세요. macOS 파일 선택기에서는 **⌘⇧G**를 누르고 절대 경로를 붙여넣으세요.
4. Speed Dial을 새로 고쳐 이미지가 보이는지 확인하고 다시 내보내세요. 스크립트는 이 `after-restore` 내보내기를 보관하고 링크 순서, 제목, 이미지 바이트, 격자, 열기 설정과 언어를 원본과 비교합니다. 다시 생성된 내부 ID와 타임스탬프는 무시합니다. 언어가 없는 이전 백업은 대상 언어를 그대로 둡니다.

내용이 일치해야 성공을 보고합니다. 불일치나 시간 초과는 검증된 복원이 **아닙니다**. 모든 사본을 유지하며 자동 롤백은 없습니다. 되돌리려면 저장된 `before-restore` 파일로 명령을 반복하세요. 내보내기 일치는 내용 동등성을 증명하지만 프로필, 출처와 실제 이미지 표시도 확인해야 합니다.

나중에 Chrome으로 돌아갈 때도 `--browser chrome`과 원하는 저장된 JSON 파일로 같은 복원 명령을 사용합니다. 형식은 원본 브라우저와 무관합니다. 복원은 링크를 합치는 대신 대상 보드 하나를 교체합니다. 두 버전 모두 필요할 수 있으면 자동 보존된 대상 사본을 유지하세요.

명령이 기다리는 동안 다른 탭이나 프로필에서 내보내지 마세요. 브라우저마다 별도 명령을 실행하세요. 이는 일회성 이전이며 이후 편집은 동기화되지 않습니다.

## 로컬 전용 저장과 검증

모든 스크립트 출력은 이 체크아웃의 고정 디렉터리 `backups/`로 갑니다. 명령은 Git이 이를 무시하고 추적하는 파일이 없는지 확인합니다. 심볼릭 링크인 출력 디렉터리는 거부합니다. 각 백업은 고유 이름으로 다른 파일을 덮어쓰지 않고 저장하고 다시 읽으며, 제목이나 URL 없이 개수와 다이제스트를 담은 `.receipt.json`을 함께 만듭니다. 잘못된 입력으로는 백업을 만들지 않습니다. CLI는 앱의 스키마, base64와 래스터 헤더 검증을 재사용합니다. 대상 앱은 원자적 가져오기 전에 이미지를 추가로 디코딩합니다.

복원에는 보드 `.json` 파일을 사용하고 동반 `.receipt.json`은 사용하지 마세요. 영수증은 검증 메타데이터를 기록할 뿐 보드를 복원할 수 없습니다. 스크립트는 이전 백업이나 원본 다운로드를 자동 삭제하지 않습니다. 필요한 사본을 보존하고 저장 공간을 로컬에서 관리하세요.

macOS/Linux에서는 디렉터리 모드가 `0700`, 파일은 `0600`입니다. Windows에서는 계정의 파일 시스템 ACL로 접근을 제한하세요. POSIX 모드는 ACL을 보장하지 않습니다. JSON 백업은 평문입니다. 스크립트에 업로드나 동기화 코드는 없습니다. 폴더는 Git, Docker 빌드 입력과 공개 프런트엔드 허용 목록에서 제외됩니다. `.gitignore`는 Git 강제 추가, 수동 공유, OS 백업이나 별도로 설정한 동기화 클라이언트를 막지 않습니다. 로컬 전용 저장을 원하면 체크아웃과 다운로드 폴더를 동기화 디렉터리 밖에 두세요.

스크립트, 테스트, 문서나 공개 사이트에 보드 데이터가 포함되지 않습니다. [브라우저 저장소 제한](local-speedial.md#what-is-private-and-what-is-not)과 [이전 수용 검증](browser-migration.md)을 보세요.
