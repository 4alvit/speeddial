# Localization

[Wiki home](Home.md) · [Contributing](../CONTRIBUTING.md)

## Supported languages

The interface supports English (`en`), Russian (`ru`), German (`de`), French (`fr`), and Spanish (`es`). English is the default and fallback; the app does not automatically choose the browser's preferred language. Select a language in Settings and save it.

`public/i18n.js` owns the shared translation catalogs and the `SpeedDialI18n` browser interface. The public [Speed Dial app](https://speeddial.alvit.here.now/) extends them with `local/i18n.js` for local storage, image paste/upload, privacy and complete-backup controls. Both editions support the same five languages. User-facing labels, settings, editor dialogs, notifications, screenshot states, validation messages, pagination, accessible names, and announcements must use this shared catalog rather than scattered inline translations.

The preference is stored as a string in localStorage under `speeddial.language`. It belongs to the current browser profile and origin and is not synchronized between devices. A language-only save does not update the board revision.

In public Speed Dial, the complete local JSON backup includes the language. A successful confirmed import applies it in the destination browser; if the browser blocks preference storage, the current page still uses the imported language and reports the persistence failure. Grid and link settings are also local and included in that backup.

In the self-hosted edition, language is not part of the shared board or server API export. Changing it alongside a grid setting applies only the grid change through the shared settings API.

Unsupported or invalid stored values and unavailable storage fall back to English on startup. If storage cannot be written, the selected language can still apply to the current page; a translated warning explains that it cannot be saved for the next visit. Private browsing and browser storage policy may affect persistence.

Bookmark titles, URLs, uploaded images, destination websites, server logs, and server-side capture locale are not translated. The self-hosted Chromium capture worker uses the configured `en-US` context independently of the interface language. Public Speed Dial has no automatic capture worker.

## Add or update translations

1. Identify the semantic message in the English catalog. Reuse an existing key only when the meaning and context really match.
2. Add the same key to every supported language and preserve all interpolation placeholders. Local-edition-only strings belong in `local/i18n.js`; common strings belong in `public/i18n.js`. Keep numbers, punctuation, and plural wording readable in that language.
3. Update both visible content and accessible text: button labels, `aria-label`, title attributes, live announcements, dialog descriptions, and error messages.
4. Keep user-supplied titles and URLs as text, never translated HTML. Do not build markup from translation strings.
5. Run `npm test`, then exercise the browser smoke test documented in [Contributing](../CONTRIBUTING.md). Inspect narrow layouts and long German/French labels as well as Cyrillic text.
6. Test persistence after reload, an unsupported stored locale, and denied localStorage. Check that a language-only change preserves the board revision.

For a new language, add its catalog, exposed language option, tests, and localized README in the same change. Consider directionality and layout explicitly before adding an RTL language; RTL support is not currently claimed.

## Documentation languages

The main README is English. Parallel entry guides are [Russian](../README.ru.md), [German](../README.de.md), [French](../README.fr.md), and [Spanish](../README.es.md). Every version links to the same language switcher and canonical detailed wiki.

Keep their essential claims aligned: access behavior, pairwise swapping, shared settings versus local language, supported preview formats, startup requirements, backup limitations, and where to find operations/security instructions. Translate meaning, not merely individual words. Command names, API fields, environment variables, and repository paths remain unchanged.

The detailed wiki uses English as its canonical language. The [process/results report](Process-and-Results.md) also has an explicitly linked [Russian version](Process-and-Results.ru.md); its shared diagrams use English labels and translated surrounding explanations. A translated README does not imply a fully translated wiki or translated third-party destination pages. Give further translations an explicit language path and retain clear links to the maintained canonical page.
