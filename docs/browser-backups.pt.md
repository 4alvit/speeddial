# Scripts de cópia e restauração local do navegador

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

[Guia de migração](browser-migration.md) · [Todas as opções de implantação](../README.md#storage-and-deployment)

Estes scripts preservam o **painel Speed Dial**: links ordenados, títulos, todos os bytes das imagens, linhas, colunas, preferência de abertura e idioma. Não copiam histórico, senhas, extensões nem outros favoritos do navegador. Usam o formato JSON portátil `speedial-local-backup` do aplicativo, não os bancos internos do Chrome ou Firefox.

Funcionam no aplicativo local do navegador em [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Não substituem os [backups do servidor](../wiki/Operations.md#backup-and-restore) para Node.js, Docker ou k3s. A exportação JSON antiga do servidor não é aceita como backup completo do navegador; transferir esse painel exige o [procedimento de coleta e conversão das imagens](browser-migration.md).

Se o painel ainda está em `speedial.alvit.here.now`, exporte primeiro desse endereço exato; agora os scripts abrem `speeddial.alvit.here.now`. Use `--no-open` com a aba antiga já aberta ou arquive explicitamente a exportação salva. Arquivos antigos `speedial-local-backup` e nomes de download `speedial-backup-*.json` continuam aceitos. Veja as [notas sobre mudança de endereço](local-speedial.md#corrected-address-and-existing-backups).

## Requisitos e suporte a navegadores

Execute Node.js 24+ nesta cópia Git. Não é preciso instalar outros pacotes. No macOS o iniciador reconhece Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf e Waterfox em `/Applications`, `~/Applications` ou `/System/Applications`. Isso é suporte à inicialização, não afirma que cada navegador foi testado. A cobertura automatizada usa Chromium, Firefox e WebKit.

```sh
npm run backup:browser -- --list-browsers
```

Para outro navegador macOS, use `--app /absolute/path/Browser.app`. Para um navegador já aberto, o navegador interno do Codex, Windows ou Linux, use `--no-open` e abra o site manualmente. Não são necessários porta de depuração, extensão, permissão de Acessibilidade nem acesso direto aos arquivos de perfil.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

A URL inicial é fixada no endereço principal. Um painel em outra origem deve ser exportado daquela origem exata; use ali `--no-open` e confira pessoalmente o endereço de destino. O armazenamento do navegador não acompanha redirecionamentos nem mudanças de nome do host.

**Os scripts são interativos.** Abrem o aplicativo e gerenciam arquivos locais, mas você clica para exportar, escolhe o arquivo de importação e confirma a substituição. Um aplicativo pode ter vários perfis: escolha o pretendido e use [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). É normal um perfil novo estar vazio. O script não consegue atestar qual perfil gerou um download.

## Fazer backup do Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Escolha seu perfil existente do Chrome, expanda a seta superior direita e clique em **Export backup**.
2. Salve com o nome sugerido `speedial-backup-YYYY-MM-DD.json` em `~/Downloads`. Sufixos de conflito de nomes, como ` (1)`, são aceitos.
3. O script espera uma exportação nova e completa, valida, copia para `backups/`, relê a cópia e mostra caminho, contagens e SHA-256. Nunca recorre a uma exportação antiga. Várias exportações simultâneas causam erro em vez de escolha por suposição.

Use `--downloads /absolute/local/folder` se o navegador baixa em outro lugar; selecione a mesma pasta no navegador. Escolha pastas locais fora da sincronização em nuvem. A espera padrão é dez minutos; `--timeout 1200` a altera para vinte. Pode ser necessário confirmar o diálogo **Save As** antes de o arquivo existir. Para uma exportação renomeada ou já baixada:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

O modo de arquivo explícito arquiva aquele arquivo; **não** obtém dados atuais do navegador nem comprova sua atualidade. Os downloads originais são mantidos. Exportações coletadas pelo observador recebem modo `0600` em POSIX; os arquivos de entrada explícitos ficam inalterados.

## Restaurar em outro navegador

Substitua `YOUR-BACKUP.json` pelo nome do backup mostrado:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

O comando de restauração exige terminal interativo e orienta um navegador/perfil por vez:

1. Valida e preserva uma cópia separada `restore-source`. No perfil de destino, exporte o painel atual, mesmo vazio. O script o salva como `before-restore` para permitir sua recuperação.
2. Confirme no terminal que a exportação veio do perfil de destino correto digitando `RESTORE`.
3. No mesmo navegador, clique em **Import backup**, escolha o arquivo `restore-source` indicado, confira o resumo e clique em **Replace this board**. No macOS, pressione **⌘⇧G** no seletor de arquivos e cole o caminho absoluto.
4. Recarregue Speed Dial, confira a exibição das imagens e exporte novamente. O script arquiva essa exportação `after-restore` e compara links ordenados, títulos, bytes das imagens, grade, preferência de abertura e idioma com a origem. IDs internos regenerados e carimbos de data são ignorados. Backups antigos sem idioma mantêm o idioma do destino.

O sucesso só é informado após o conteúdo coincidir. Divergência ou tempo esgotado **não** é restauração verificada. Todas as cópias são mantidas; não há reversão automática. Para reverter, repita o comando com o arquivo `before-restore` salvo. Exportações idênticas comprovam igualdade de conteúdo; ainda é necessário verificar perfil, origem e imagens visíveis.

Para voltar depois ao Chrome, use o mesmo comando com `--browser chrome` e o JSON salvo desejado. O formato independe do navegador de origem. Cada restauração substitui um painel de destino, sem mesclar links; guarde a cópia automática do destino se ambas as versões puderem ser necessárias.

Não exporte de outra aba ou perfil enquanto um comando espera. Execute comandos separados para navegadores distintos. É uma transferência única; edições posteriores não são sincronizadas.

## Armazenamento somente local e validação

Toda saída dos scripts vai para o diretório fixo `backups/` desta cópia Git. O comando verifica que Git o ignora e que não contém arquivos rastreados. Rejeita diretório de saída que seja link simbólico. Cada backup tem nome exclusivo, é gravado sem sobrescrever outro arquivo, relido e acompanhado de `.receipt.json` com contagens e resumos, sem títulos ou URLs. Entrada inválida não cria backup. A CLI reutiliza a validação de esquema, base64 e cabeçalhos raster do aplicativo; o aplicativo de destino também decodifica imagens antes da importação atômica.

Restaure com o arquivo `.json` do painel, não com o `.receipt.json` correspondente. O recibo registra metadados de verificação e não restaura um painel. Os scripts não removem automaticamente backups antigos nem downloads originais; retenha as cópias necessárias e gerencie seu armazenamento localmente.

No macOS/Linux o diretório tem modo `0700` e os arquivos `0600`. No Windows restrinja acesso com ACLs do sistema de arquivos da conta; modos POSIX não garantem ACLs. Backups JSON são texto sem criptografia. Os scripts não têm código de upload ou sincronização. A pasta fica fora do Git, da entrada de compilação Docker e da lista permitida do frontend público. `.gitignore` não impede inclusão forçada no Git, compartilhamento manual, backups do sistema ou cliente de sincronização configurado separadamente. Para armazenamento só local, mantenha a cópia Git e a pasta de downloads fora de diretórios sincronizados.

Nenhum dado de painel está embutido nos scripts, testes, documentação ou site público. Veja as [limitações do armazenamento do navegador](local-speedial.md#what-is-private-and-what-is-not) e a [aceitação da migração](browser-migration.md).
