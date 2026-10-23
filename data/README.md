# Inhaltsvertrag

Kategorien: `categories.json`, stabile `slug`-Werte für URLs und Beziehungen.

Guide-Frontmatter: `title`, `author`, `updated`, `status`, `review`; bei Migration zusätzlich stabile `id`, `sources` (URL, Titel, Abrufdatum), `gameVersion`, `region`, `sourceMessageIds`.

Pet-Daten künftig als JSON mit getrennten Mechanik- und Empfehlungsfeldern: `id`, `board`, `slot`, `stat`, `unit`, `min`, `max`, `role`, `mode`, `recommendation.keepFrom`, `sources`, `review`, `screenshots`. Unbekannte Werte sind `null`, niemals 0. Stoppschwellen sind redaktionelle Empfehlungen, keine Spielmechanik.

Screenshots künftig mit stabiler ID, relativem Dateipfad, Alt-Text, Quelle, Caption und optionalem Platzhalterstatus. Interne Links über Guide-IDs und eine zentrale Zuordnung aus Studio-Nachrichten-IDs migrieren.

Redaktionelle Kommentare separat nach Guide-ID und exakter Textstelle/Quellrevision speichern. Private Kommentare bleiben außerhalb dieses öffentlichen Repositories. Verschieben eines Guides benötigt eine Weiterleitung und Prüfung aller internen Links.
