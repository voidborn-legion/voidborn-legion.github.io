# AION 2 Academy · Voidborn

VitePress/Vue-Website für die Voidborn-Legion. Öffentliche Vorschau: https://voidborn-legion.github.io/ . Änderungen an `main` werden über GitHub Actions gebaut und veröffentlicht. Die Discord-Migration und fachliche Prüfung sind noch nicht erfolgt.

## Lokal starten

Node.js 22+ empfohlen.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Struktur

- `docs/`: veröffentlichte Markdown-Seiten
- `docs/.vitepress/theme/`: Vue-Komponenten und Gestaltung
- `docs/public/images/`: öffentliche Bilddateien
- `data/`: wiederverwendbare strukturierte Daten
- `DESIGN.md`: Designsystem
- `PRODUCT.md`: Produktanforderungen

Keine privaten Redaktionskommentare, Zugangsdaten oder unbearbeiteten Studio-Exporte in dieses öffentliche Repository aufnehmen. Seiten mit `status: draft` werden vom Website-Build ausgeschlossen, bleiben im öffentlichen Repository jedoch lesbar.

## Pages CMS

Die Konfiguration in `.pages.yml` bereitet Guides, Themen und Bild-Uploads vor. Bei https://app.pagescms.org/ mit GitHub anmelden und die Pages-CMS-App für die Organisation `voidborn-legion` ausschließlich auf `voidborn-legion.github.io` beschränken. Anmeldung und Berechtigung sind noch nicht abgeschlossen; ein Speichern über den Editor ist noch nicht getestet.

Neue Guides benötigen einen Veröffentlichungs- und Prüfstatus. `published` veröffentlicht eine Seite; `draft` hält sie von der Website fern. `pending` kennzeichnet noch ungeprüfte Inhalte. Die Verträglichkeit erweiterter Markdown-Blöcke mit dem visuellen Editor muss vor der ersten Inhaltsmigration geprüft werden.

## Weitere Phasen

GitHub Pages und Actions sind eingerichtet. Als Nächstes: Pages-CMS-Anmeldung und Bearbeitung testen, danach Manager-Plugin und geprüfte Migration. Keine eigene Server- oder Tunnel-Abhängigkeit für die öffentliche Website.
