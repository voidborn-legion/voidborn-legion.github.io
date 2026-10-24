# Originalbilder ohne native Chat-Datei übernehmen

## Werkzeug

academy_import_image ergänzt academy_upload_image. Der native Upload bleibt mit unverändertem Dateiparameter verfügbar. Beide Wege verwenden screenshot.upload und dieselbe gemeinsame Bildprüfung sowie image.write-Rechte, Guide-Beschränkungen und expectedHead-Konfliktschutz.

Eingabe:

```json
{
  "expectedHead": "AKTUELLER_40_STELLIGER_COMMIT_SHA",
  "id": "screenshot:VORHANDENE_PLATZHALTER_ID",
  "base64": "ECHTE_ROHE_STANDARD_BASE64_AUS_DER_QUELLE",
  "alt": "Beschreibung des Originalbildes",
  "caption": "Optionale Bildunterschrift"
}
```

Die Beispielwerte sind Platzhalter und nicht ausführbar. Im tatsächlichen Chat verfügbare Werkzeugdefinitionen lesen. Kein Data-URL-Präfix, keine Download-URL, kein Dateipfad und keine erfundenen Bytes. Nur tatsächlich aus dem Quellplugin erhaltene Bilddaten verwenden.

## Prüfung und Ausgabe

- PNG-/JPEG-/WebP-Signatur; maximal 2 MiB nach Base64-Dekodierung. Strikte Standard-Base64-Prüfung inklusive Länge und kanonischem Encoding vor dem Speichern.
- Keine URL-Abrufe durch den Importweg. Server bestimmt Dateierweiterung und Inhalts-Hash.
- Gemeinsamer Befehl speichert Originalbytes, Guide und Metadaten in einem Entwurfscommit. Vorhandene Platzhalter-ID und Feedback bleiben erhalten.
- Upload-/Import-Ergebnis enthält commitSha, published:false, guideId, placeholderId, assetId und asset mit Dateipfad, Alt-Text, Bildunterschrift und SHA-256.
- Nach Import academy_read_image mit den zurückgegebenen guideId und assetId verwenden. Wenn lokal berechenbar, SHA-256 der Quellbytes vergleichen.
- Pro Aufruf ein Bild; vor dem nächsten Schreibvorgang aktuellen Zielstand lesen. Bei unklarem Ergebnis erst Zuordnung lesen, nicht blind erneut importieren.

MCP begrenzt den eingehenden Stream auf 2.900.000 Bytes. Nur tools/call für academy_import_image darf die bisherige Anfragegrenze von 750.000 Bytes überschreiten; andere Methoden behalten diese Grenze. Die tatsächliche Bildgrenze bleibt 2 MiB. Base64 und JSON dürfen nicht mit der dekodierten Dateigröße verwechselt werden.

## Grenzen und Nachweis

Die Bildprüfung ist eine Signatur- und Größenprüfung, kein vollständiger Bilddecoder. Derselbe Prüfpfad gilt für den nativen Upload und Studio-Befehle. Bilder werden weiterhin im öffentlichen Repository gespeichert und nicht allein durch eine geschützte Verwaltung privat.

Abgedeckt: bytegleiche Übertragung, Inhalts-Hash, Bildzuordnung aus echtem Commit-Plan, Erhalt des Guide-Texts und Platzhalters, Konfliktabweisung, fehlende Rechte, Guide-Beschränkungen, ungültige Daten, Formatprüfung, exakte 2-MiB-Grenze und Transportgrenzen. Ein vollständiger authentifizierter Import im ChatGPT-Host ist separat nachzuweisen; verfügbare Discovery allein beweist ihn nicht.
