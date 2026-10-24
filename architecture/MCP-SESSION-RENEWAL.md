# Academy-Verbindung automatisch verlängern

24.10.2026: Die bisherige Ausgabe enthielt nur ein Access-Token mit 3600 Sekunden Laufzeit. Es gab keinen Refresh-Grant. Die wiederkehrende Anmeldung war damit ein fehlender Dienstbestandteil, keine notwendige stündliche Bedienhandlung des Nutzers.

## Verhalten

- Neue Anmeldungen liefern ein kurzlebiges Access-Token und ein getrenntes Refresh-Token. Metadaten und Registrierung bieten authorization_code und refresh_token an.
- Refresh-Tokens sind client-, benutzer-, scope- und ressourcengebunden. Sie werden ausschließlich als Hash gespeichert und bei jeder Erneuerung ersetzt.
- Die Sitzung endet absolut 30 Tage nach der Anmeldung. Verlängern setzt diese Grenze nicht zurück. Danach, nach Rechteentzug oder ungültiger Verbindung kann eine erneute Anmeldung nötig sein.
- Wiederverwendung eines bereits ersetzten Refresh-Tokens sperrt diese Sitzung einschließlich ihrer Access-Tokens. Andere Sitzungen bleiben erhalten. Clients müssen Erneuerungen derselben Verbindung nacheinander durchführen und das neueste Token speichern.
- Rechte werden beim Refresh und weiterhin bei jeder Werkzeugaktion geprüft. Eine Erneuerung erweitert keine Berechtigungen.
- Die planmäßige Bereinigung entfernt abgelaufene Sitzungen und Token-Zuordnungen. Keine Guide-Inhalte und keine GitHub-Provider-Tokens werden dabei gespeichert oder verändert.

## Einführung

Zuerst die additive migration-mcp-refresh.sql auf die vorhandene D1-Datenbank anwenden, dann den Worker bereitstellen. Die neuen Tabellen ergänzen das bestehende Auth-Schema; bestehende Tokens behalten ihre ursprüngliche Laufzeit. Neue Tests initialisieren Basis-, Manager- und Refresh-Schema.

Bestehende ChatGPT-Verbindungen erhalten nicht nachträglich ein Refresh-Token: einmal nach dem Update erneut verbinden. Ein Plugin-Paketupdate ist für diese Dienstkorrektur nicht erforderlich. Die erfolgreiche Erneuerung im tatsächlichen ChatGPT-Host muss nach einer neuen Anmeldung noch bestätigt werden.

## Nachweise

18 Serverprüfungen bestanden: vollständiger PKCE-/Consent-Code-Austausch mit Refresh-Token, simuliertes Access-Ablaufen, Erneuerung und Rotation, Client-/Ressourcen-/Scope-Abgrenzung, Replay-Sperre, Schutz anderer Sitzungen, Rechteentzug und Ablauf. Live: Refresh-Grant in Discovery sichtbar, ungültiges Refresh-Token abgewiesen und anonyme MCP-Discovery weiterhin funktionsfähig.

Worker-Version: 5b57e730-5624-4324-a202-6948a635249f. Keine realen Anmeldetokens zu Testzwecken erzeugt oder ausgegeben. Der Live-Host-Nachweis der erfolgreichen Benutzer-Erneuerung steht noch aus.
