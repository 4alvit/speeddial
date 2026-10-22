# Código, implantação e verificação

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

[Página inicial da wiki](Home.md)

O repositório público `speeddial` contém as duas edições do aplicativo, testes, exemplos genéricos de implantação e documentação. Começa com um histórico Git novo e dados sintéticos de teste. Arquivos operacionais privados preservam material histórico e registros de recuperação, consumindo uma revisão pública fixada ou imagem imutável sem duplicar código do aplicativo.

O [aplicativo local do navegador](https://speeddial.alvit.here.now/) inicia cada visitante com um painel vazio. Publicar código não copia links ou capturas pessoais para outro navegador. Os [scripts de backup](../docs/browser-backups.pt.md) orientam uma transferência deliberada com cópia de resgate do destino e comparação exata do conteúdo após a restauração.

## Processo de implantação

![Validação do código, ensaio isolado de restauração, implantação e aceitação são etapas separadas.](images/release-process.svg)

A edição servidor continua suportando Node.js, Docker e k3s. Fixe a revisão pública, compile ou escolha imagem imutável verificada e aplique a configuração privada fora deste repositório. Separe credenciais e volume persistente de dados da imagem do aplicativo. Use o [guia de transição e reversão](../deploy/README.md) quando precisar migrar uma instalação existente.

## Limites do repositório e dos dados

![O código público atende implantações privadas; dados pessoais do navegador e registros de recuperação do servidor permanecem privados.](images/release-results.svg)

O código público não contém painel pessoal inicial. Os backups locais ficam em `backups/`, ignorado pelo Git; conjuntos de recuperação do servidor incluem SQLite, imagens referenciadas e credenciais protegidas separadamente. Os formatos atendem edições diferentes e não são intercambiáveis.

## Verificação

As verificações locais e de CI validam dados sintéticos e os cenários executados. As duas edições mantêm cinco idiomas, controles recolhidos, trocas em pares, prévias que seguem o ponteiro, dimensões da grade e navegação na mesma janela por padrão.

Um ensaio de migração do servidor compara IDs, ordem, títulos, URLs, configurações, referências de imagens e integridade SQLite. As verificações de rotação confirmam que sessões antigas falham após reiniciar. A aceitação real também verifica roteamento previsto, credenciais, disponibilidade de imagens e preservação de dados no ambiente de destino.

Uma verificação bem-sucedida do código não prova que implantação ou restauração ocorreram. Mantenha privados os comprovantes reais e inventários pessoais. Os diagramas descrevem arquitetura e processo, sem garantir desempenho, disponibilidade ou tempo de recuperação. O código público permanece `UNLICENSED`.
