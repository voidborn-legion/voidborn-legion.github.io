# Voidborn Academy Studio – Implementierung und Inbetriebnahme

Stand: 23. Oktober 2026. Entwicklung auf `dev/academy-studio-foundation`. Keine Veröffentlichung oder Aktivierung des Plugin-Updates.

## Tatsächlicher Stand je Phase

| Phase | Umgesetzt und geprüft | Noch offen |
| --- | --- | --- |
| 1 – Architektur | Gemeinsames JSON-Schema, stabile IDs, Quellen, Textanker, Entwurfsgrenzen und Architekturbericht. Bestehende 12 Guides und 11 Themen erfasst. | Private Kommentarablage ist bewusst nicht eingerichtet. |
| 2 – Manager | Gemeinsame Befehle für Browser und lokalen Manager-Executor. Kommentar/Antwort über beide Zugänge getestet. Bestehendes Plugin als Update 0.2.0 vorbereitet. | Update nicht aktiviert. Kein neuer eigener MCP-Endpunkt; GitHub-App-Fallback muss direkte Änderungen separat validieren. |
| 3 – Dashboard | Guides, fehlende Bilder, Kommentare, Aufgaben, Suche, Navigation und Themenreihenfolge. Echte lokale Git-Daten. | Onlinebetrieb erst nach Authentifizierungseinrichtung. |
| 4 – Editor | Vue/Tiptap, Markdown-Umschaltung, Tabellen, Info-/Klappboxen, Kommentare/Antworten/Status, Platzhalter, Bild-Upload/Wiederverwendung, Entwurfsspeicherung, Versionen/Diff/Wiederherstellen. | Umfangreiche und verschachtelte VitePress-Sonderfälle außerhalb des Pets-Testdokuments nicht vollständig abgedeckt. Quellen-/Rechtehinweise für Bilder sind im Modell vorhanden, im Uploadformular noch nicht vollständig bearbeitbar. Kommentare an Tabellen-/Bildobjekten sind modelliert; die Oberfläche legt derzeit Textanker an. |
| 5 – Spieldaten | Gemeinsamer Datensatz, Studio-Eingabe, Herkunft/Region/Patch, Spielgrenzen getrennt von Empfehlungen, VitePress-Projektion mit Brett-/Slot-/Klassen-/Modusfiltern. | Studio hat derzeit eine Textsuche statt separater Filter je Dimension. Alternative Effekte bleiben im Modell erhalten, haben noch kein eigenes Eingabefeld. Keine Spielwerte fachlich bestätigt oder freigegeben; Tabelle deshalb leer. |
| 6 – Prüfung | 17 lokale Tests bestanden, Schema und ursprüngliche Anker geprüft, Website und Studio gebaut, Worker erfolgreich gebündelt, Browserprüfung mit realem Pets-Entwurf. Lokale Git-Konflikte/Upload/Restore geprüft. | Echter GitHub-OAuth-/D1-/Remote-Schreibdurchlauf fehlt. Keine Onlinefreigabe, keine Veröffentlichung, keine behauptete vollständige Produktionsreife. |

Die vier ursprünglichen Hinweise aus dem Discord-Studio sind nicht importiert oder erfunden worden. Das Discord-Studio wurde nicht verändert. Sieben vorhandene Prüfpunkte aus der Markdown-Liste wurden im separaten Arbeitsstand in zentrale Aufgaben übernommen. Ein neuer Testkommentar und eine Manager-Antwort sind als nicht vertrauliche Arbeitsdaten gespeichert. Die fünf Original-Bildplatzhalter sind weiterhin offen.

## Lokal ansehen

1. `npm ci` im Repository ausführen.
2. `npm run studio:api` startet ausschließlich auf `127.0.0.1:4181` den lokalen Git-Zugang.
3. `npm run studio:dev` startet die Oberfläche auf `http://127.0.0.1:4180/studio/`.
4. Der Arbeitsstand liegt auf `draft/studio-pets-workspace`. Der lokale Adapter schreibt dort Git-Commits, ohne den ausgecheckten Entwicklungsbranch oder `main` umzuschalten. Er pusht nicht automatisch.

Der lokale Zugriff setzt den vertrauenswürdigen Rechner voraus und ersetzt keinen Online-Login. Der Gateway ist nicht für öffentliches Hosting vorgesehen. Der vollständige Pets-Entwurf stammt aus dem unveränderten Branch `draft/pets-spezieskenntnis-migration` und wird beim Initialisieren kopiert.

## Gemeinsamer Datenzugriff

- `packages/academy-model/schema.mjs` und `schemas/studio-snapshot.schema.json`: dasselbe validierte Modell.
- `commands.mjs`: gemeinsamer Befehlsweg für Studio und Manager-Executor; aktuelle `expectedHead` bei jedem Speichern erforderlich.
- `git-local.mjs`: atomare lokale Git-Änderung mit erwarteter vorheriger Branch-Version.
- `services/studio-api/github.mjs`: vorbereiteter GitHub-Adapter mit denselben Befehlen, Git-Tree/Commit und nicht erzwungenem Ref-Update.
- `scripts/studio-command.mjs`: JSON-Auftrag über stdin. `{"op":"read"}` liest den aktuellen lokalen Arbeitsstand.
- `.academy/studio/guides/*.json`: Kommentare, Aufgaben, Bildzuordnung und Historie außerhalb des Guide-Textes. Öffentliches Repository bedeutet öffentlich lesbare Daten, auch auf Entwurfsbranches.
- `data/game/pets.json`: einzige strukturierte Datenquelle für Studio und öffentliche Pet-Tabellen. Öffentliche Projektion verlangt zugleich `publication: published` und `verification.status: verified`; normales Speichern setzt `publication: draft`.

Das aktuell installierte Manager-Plugin bleibt auf seiner bisherigen Version. Das vorbereitete Paket 0.2.0 ist ein Skill-Update mit bestehender GitHub-App-Verbindung, kein bereits freigeschalteter zusätzlicher MCP-Dienst.

## Zieladresse und Zugangsschutz

Ziel der Oberfläche bleibt `https://voidborn-legion.github.io/studio/`. GitHub Pages stellt statische Dateien bereit. Das Anmeldefenster und die App-Dateien wären daher öffentlich erreichbar; autorisierte Schreibzugriffe laufen ausschließlich über einen getrennten HTTPS-Dienst. Im öffentlichen Repository gespeicherte Kommentare werden durch diesen Login nicht privat.

Der vorbereitete Dienst ist ein Cloudflare Worker mit D1 nur für kurzlebige Anmeldedaten. GitHub-Provider-Tokens bleiben verschlüsselt auf dem Server. Der Browser erhält eine kurzlebige, opaque Sitzung im Arbeitsspeicher, kein GitHub-Token. Die Sitzung verfällt nach 30 Minuten; ein Neuladen erfordert erneute Anmeldung. PKCE, einmalige Anmeldetickets, feste Origins und tatsächliche Repository-Schreibrechte sind implementiert. Ohne vollständige Konfiguration liefert der Dienst keine Academy-Daten aus.

## Onlineeinrichtung – noch nicht ausgeführt

Diese Schritte benötigen den Zugriff des Eigentümers auf GitHub und den gewünschten Hostingaccount. Keine Zugangsdaten in Chat, Repository oder Plugin-Dateien eintragen.

1. **GitHub App registrieren:** nur das Repository `voidborn-legion/voidborn-legion.github.io` auswählen. Berechtigungen auf Contents lesen/schreiben und Metadata lesen beschränken. Homepage ist die Academy, Callback exakt `<API_ORIGIN>/auth/callback`. User-Authorization aktivieren. Webhooks/Device Flow werden hierfür nicht benötigt. Benutzer benötigen zusätzlich selbst Schreibrechte im Repository. Keine zusätzlichen Repository-Berechtigungen ohne Prüfung vergeben.
2. **Worker/D1 vorbereiten:** separate echte Wrangler-Konfiguration auf Basis `services/studio-api/wrangler.example.jsonc` erstellen, D1-Datenbank anlegen und als `DB` binden. `services/studio-api/schema.sql` anwenden. Die Beispieldatei enthält bewusst keine Datenbank-ID oder Zugangsdaten.
3. **Serverkonfiguration:** `API_ORIGIN` auf die tatsächliche HTTPS-Worker-Origin setzen, `STUDIO_ORIGIN=https://voidborn-legion.github.io`, `DRAFT_BRANCH=draft/studio-pets-workspace`. `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` und einen zufälligen 32-Byte-Schlüssel als 64 Hexzeichen für `TOKEN_KEY` im Secret-Speicher des Hosters hinterlegen. Ausschließlich dessen sichere Oberfläche bzw. Secret-Eingabe verwenden.
4. **Entwurfsbranch bereitstellen:** der Arbeitsbranch muss im Repository vorhanden sein und das aktuelle Modell enthalten. Keine Ausweichschreibvorgänge auf `main`. Entwicklungsstand und Inhaltsstand vor Onlinebetrieb zusammenführen und erneut validieren; weder alte Kommentarbestände noch Entwürfe überschreiben.
5. **Lokale/Preview-Prüfung mit echter Anmeldung:** Zugang ohne Sitzung und fremde Origins müssen abgewiesen werden. GitHub-Benutzer ohne Schreibrecht muss ausgeschlossen bleiben. Dann einen echten, nicht vertraulichen Kommentar über Browser speichern, über Manager lesen/beantworten, erneut im Browser prüfen und zwei gleichzeitige Änderungen auf Konflikte testen. Abgelaufene/erneut verwendete Tickets und Sitzungen prüfen. Diese Onlineprüfung wurde noch nicht durchgeführt.
6. **Bauartefakt:** `VITE_STUDIO_API_ORIGIN` nur auf die öffentliche API-Origin setzen; dies ist kein Geheimnis. `npm run build:release` baut Website plus Studio nach `docs/.vitepress/dist/studio/`. Ohne HTTPS-Origin bricht der kombinierte Bau ab. Der Befehl lädt nichts hoch. Der bestehende Deploy-Workflow bleibt beim bisherigen Website-Bau; seine Umstellung und Veröffentlichung erfolgen erst nach Freigabe und bestandener Onlineprüfung.
7. **Manager aktivieren:** vorbereitetes Plugin-Paket 0.2.0 prüfen, dann separat freigeben und aktualisieren. Das Paket nicht als neue unabhängige Academy installieren. Anschließend die natürliche Sprache gegen echte gemeinsame Daten testen.

Es wurde kein Cloudflare-Projekt, keine Datenbank und keine GitHub App angelegt. Kein kostenpflichtiger Tarif wurde gebucht. Die Bündelung mit `wrangler deploy --dry-run` ist ein lokaler Build und kein Deployment. Der kostenlose Worker-Tarif hat begrenzte CPU-/Subrequest-Ressourcen; Eignung und tatsächliche Laufzeitkosten sind vor Freigabe mit dem echten Datensatz zu prüfen. Der Adapter begrenzt aktuell einen Auftrag auf 20 Dateien und einen geladenen Snapshot auf 120 Dateien; größere Bestände brauchen einen sparsameren/paginierten Adapter.

## Nachweise und Grenzen

- `npm run studio:test`: 17 Tests, einschließlich realer Git-Transaktionen im Wegwerf-Clone, Konfliktablehnung, Kommentar/Antwort, Bildbytes und Wiederherstellung; außerdem PKCE-Testvektor, Verschlüsselung/Origin-Prüfung, nicht konfigurierte API und Markdown-Rundlauf des tatsächlichen Pets-Entwurfs.
- `npm run studio:check -- --check-anchors`: Schema, Querverweise, Guide-/Kategorieabdeckung und gepinnter Originalentwurf geprüft. Source-Branch-Baseline: 12 Guides, 5 fehlende Bilder, 0 Kommentare, 1 ursprüngliche Aufgabe. Separater Inhaltsarbeitsstand: 1 neuer Kommentar mit Antwort und 7 Aufgaben. Das sind unterschiedliche Branch-Stände, keine doppelten Datenbestände.
- `npm run build` und `npm run studio:build`: bestanden. Studio-Build weist auf das große Editor-JavaScript-Paket hin; eine spätere Aufteilung ist sinnvoll.
- Worker-Dry-Run: erfolgreich gebündelt, keine Anmeldung oder Cloudverbindung dadurch nachgewiesen.
- Visuelle Prüfung: breiter Desktop, 1271px-Layout und 390px-Layout in explizit dimensionierten Browser-Iframes sowie Editor. Vier gemeldete Layoutprobleme im anschließenden Review als behoben bewertet. Kein Ersatz für Online- und Sicherheitsabnahme.
- Veröffentlichung gesperrt: keine Änderung am veröffentlichten `main`, ursprünglicher Pets-Entwurfsbranch unverändert, Discord-Studio unverändert.

## Primärquellen zur gewählten Architektur

- [GitHub Pages als statischer Hostingdienst](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub: PKCE für OAuth und GitHub Apps](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/)
- [Cloudflare Workers: aktuelle Ressourcenlimits](https://developers.cloudflare.com/workers/platform/limits/)
