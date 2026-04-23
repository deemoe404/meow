# dict_v1 Training Sample Sources

The `samples/*.txt` files are UTF-8 training text for the browser zstd dictionary.

- `01-cn-short.txt` through `07-technical-url-formats.txt`: project-authored representative samples for chat, UI, protocol, URL, Markdown, JSON, shell, path, punctuation, and emoji inputs.
- `09-url-social-patterns.txt`: project-authored URL and social/deep-link patterns. Example domains follow IANA's reserved example-domain guidance: `https://www.iana.org/help/example-domains`.
- `10-emoji-reactions.txt`: project-authored emoji reaction samples informed by the Unicode Emoji List chart: `https://www.unicode.org/emoji/charts/emoji-list.html`.
- `11-network-slang.txt`: project-authored short examples using common Chinese internet slang and annual-list terms. Public references checked include the 2024 and 2025 annual network-language announcements from the National Language Resources Monitoring and Research Center network-media group.
- `12-social-platform-formats.txt` through `15-tech-paste-content.txt`: project-authored synthetic samples for social-platform message shapes, Chinese URL/share-link patterns, emoji/clipboard edge cases, and technical paste content. These files do not copy real social posts or platform content; Bilibili/Xiaohongshu/Weibo/Zhihu-like URL shapes use `example.com` or synthetic paths only.
- `08-tatoeba-cc0-cmn.txt`: Mandarin CC0 sentence from Tatoeba's per-language export, fetched from `https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences_CC0.tsv.bz2` on 2026-04-23. Source row: `10597783	cmn	2022/2972 新年快乐！	2021-12-31 15:06:47`.

Common Voice Chinese was reviewed as a distribution reference only; its sentence data is not copied into this repository.
