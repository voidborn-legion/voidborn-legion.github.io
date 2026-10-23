# AION 2 Academy · Voidborn

VitePress/Vue-Website für die Voidborn-Legion. Phase 2: Designsystem, Startseite und Themenstruktur. Die Discord-Migration und fachliche Prüfung sind noch nicht erfolgt.

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

Keine privaten Redaktionskommentare, Zugangsdaten oder unbearbeiteten Studio-Exporte in dieses öffentliche Repository aufnehmen. Entwürfe außerhalb von `docs/` aufbewahren; der Build weist `status: draft` innerhalb der veröffentlichten Seiten zurück.

## Weitere Phasen

GitHub-Pages-Veröffentlichung und Actions in Phase 3, Pages CMS in Phase 4, Manager-Plugin in Phase 5, geprüfte Migration in Phase 6. Keine eigene Server- oder Tunnel-Abhängigkeit für die öffentliche Website.
