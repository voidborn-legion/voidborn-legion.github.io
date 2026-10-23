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

Die Konfiguration in `.pages.yml` bereitet Guides, Themen und Bild-Uploads vor. Bei https://app.pagescms.org/ mit GitHub anmelden. Anmeldung und Repository-Zugriff sind eingerichtet. Am 23.10.2026 wurde die Website-Hilfe im CMS geändert und gespeichert; der resultierende GitHub-Actions-Lauf und die Änderung auf der öffentlichen Website wurden erfolgreich geprüft. Bild-Uploads und neue Einträge sind noch nicht separat getestet.

Neue Guides benötigen einen Veröffentlichungs- und Prüfstatus. `published` veröffentlicht eine Seite; `draft` hält sie von der Website fern. `pending` kennzeichnet noch ungeprüfte Inhalte. Der visuelle Editor entfernt HTML-Tags wie `details` und `summary` bereits beim Laden. Deshalb keine HTML-Klappboxen in CMS-gepflegten Guides verwenden; die Website-Hilfe nutzt stattdessen eine normale Zwischenüberschrift. Tabellen, Links und der vorhandene VitePress-Infoblock blieben beim getesteten Speichern erhalten. Weitere erweiterte Blöcke vor ihrer Verwendung einzeln prüfen.

## Weitere Phasen

GitHub Pages, Actions und die CMS-Bearbeitung bestehender Guides sind geprüft. Als Nächstes: Manager-Plugin und geprüfte Migration. Keine eigene Server- oder Tunnel-Abhängigkeit für die öffentliche Website.
