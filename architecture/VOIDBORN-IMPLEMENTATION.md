# Roter Voidborn-Stil: erste Umsetzung

## Umfang

Die bestätigte Gestaltung ist im VitePress-Theme eingebaut: eigenes Spalt-/Obsidian-Motiv, rotes V, fast schwarze Flächen, Cinzel-Titel, Source Sans 3 für längere Texte. Startseite verwendet die echten Themen aus `data/categories.json`, URL-basierte Suche/Filter, Themenlinks und eine Ausrüstungs-Empfehlung. VitePress-Suche, Markdown, Outline, Tabellen, Bilder und Klappboxen bleiben nutzbar. Links zum Studio sind nicht öffentlich hinzugefügt worden. Das produktive Studio selbst wurde nicht geändert.

## Echte Inhalte

Mit dem Academy-Manager wurde der Import `guide:c15f1f3b-73a0-4136-8f89-b8b21ef5db94` auf Revision `add9d52cc7b54f66c457f75a82af1bfa08166538` gelesen. Keine MCP-Schreibaktion. Drei Abschnitte wurden als lokaler Redaktionsentwurf unter `docs/redaktion/ausruestung.md` sprachlich überarbeitet: Verstärkung/Vererbung, Seelenbindung und Steine. Original-IDs und die Herkunft bleiben erhalten; die anderen Importabschnitte, Kommentare, Aufgaben und Bilder bleiben im Studio unverändert. Fachliche Unsicherheiten und fehlende Ring-Reroll-Regeln werden ausdrücklich benannt. Es wurde keine neue Gameplay-Recherche oder fachliche Freigabe behauptet.

## Schutz vor versehentlicher Veröffentlichung

Der Guide bleibt `status: draft`. Standard-Builds schließen ihn wie alle Entwürfe aus. Nur mit `ACADEMY_REDESIGN_PREVIEW=1` wird genau `redaktion/ausruestung.md` zur lokalen Vorschau zugelassen. Die Startseite zeigt den Link dorthin ebenfalls nur in diesem Modus. Der Vorschau-Modus ist sichtbar gekennzeichnet. Kein Deployment, Push, Commit oder Wechsel von Entwurf zu veröffentlicht.

## Vorschau

`$env:ACADEMY_REDESIGN_PREVIEW='1'; node node_modules/vitepress/bin/vitepress.js dev docs --host 127.0.0.1 --port 4185 --strictPort`

Standard-Build ohne diese Variable: `node node_modules/vitepress/bin/vitepress.js build docs`. Für den Produktionsbuild muss die Variable entfernt bzw. in einem frischen Prozess nicht gesetzt sein. Die Galerie unter `studio-concept/voidborn.html` bleibt als ursprünglicher Stilvergleich erhalten.
