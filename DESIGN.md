---
name: Voidborn Academy
description: Nächtlicher Legionsatlas für die AION 2 Academy
colors:
  legion-gold: "#d7b777"
  gold-hover: "#ecd5a4"
  gold-deep: "#c4a468"
  night: "#0b1017"
  night-alt: "#101720"
  surface: "#121b25"
  surface-raised: "#182330"
  ivory: "#f0eee7"
  muted: "#b4bdc9"
  quiet: "#a1afbe"
  line: "#2c3948"
  action-ink: "#10151c"
  entry-cool: "#172631"
  entry-cool-hover: "#203645"
  entry-warm: "#292820"
  entry-warm-hover: "#393627"
  search-surface: "#192531"
  filter-surface: "#18222d"
  filter-text: "#c4cdd8"
  filter-hover: "#293b4d"
  row-alt: "#151f2a"
  row-hover: "#213142"
  reading-surface: "#192329"
  reading-preview: "#0f171e"
  reading-hover: "#131e28"
  guide-note: "#17242f"
  guide-details: "#16212c"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(64px, 7.5vw, 96px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(26px, 2.5vw, 36px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "18px"
    lineHeight: 1.75
  label:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "15px"
rounded:
  control: "5px"
  field: "6px"
  note: "8px"
  card: "12px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  section: "64px"
  section-wide: "80px"
components:
  button-primary:
    backgroundColor: "{colors.legion-gold}"
    textColor: "#10151c"
    rounded: "{rounded.control}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
  button-text:
    textColor: "#e4e8ee"
  filter:
    backgroundColor: "{colors.filter-surface}"
    textColor: "{colors.filter-text}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  filter-selected:
    backgroundColor: "{colors.legion-gold}"
    textColor: "#10151c"
  topic-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.note}"
    padding: "22px 28px"
  topic-row-hover:
    backgroundColor: "{colors.row-hover}"
  search-field:
    backgroundColor: "{colors.search-surface}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "4px 16px"
  entry-cool:
    backgroundColor: "{colors.entry-cool}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.card}"
    padding: "30px"
---

# Design System: Voidborn Academy

## Overview

**Creative North Star: "Nächtlicher Legionsatlas"**

Ein nächtlicher Legionsatlas: atmosphärisch im Einstieg, präzise in der Orientierung und ruhig beim Lesen. Dunkle blaue Flächen, elfenbeinfarbene Schrift und sparsam eingesetztes Gold verbinden die Academy mit Voidborn. Die originale Fantasy-Zitadelle trägt die Stimmung; sie ist kein Beleg für Spielmechaniken.

Die Website ist eine Vorschau vor der Discord-Migration. Ein kurzer Hinweis macht den Stand sichtbar. Zwei Einstiegswege, eine durchsuchbare Themenliste, eine ausgearbeitete Beispielseite und Routineverweise führen durch die Academy. Die deutschen Texte sprechen Spieler direkt an und benennen konkrete Aufgaben.

**Key Characteristics:**
- Nächtliche Flächen mit klarer Lesbarkeit
- Cinzel als Akzent, Source Sans 3 als Arbeitsstimme
- Gold für Orientierung und ausgewählte Aktionen
- Tonale Flächen und klare Themenzeilen ohne schwebende Effekte

## Colors

### Primary
Legionsgold markiert Hauptaktionen, ausgewählte Filter, Verweise und ikonografische Wegweiser. Das hellere Gold signalisiert Hover und Tastaturfokus; das tiefere Gold gehört zur VitePress-Markenfamilie.

### Neutral
Nachtschwarz trägt die Seite und Navigation. Die alternative Nachtfläche, die weiche Fläche und die erhöhte Fläche staffeln Navigation, Karten und Tabellen. Elfenbein ist die Hauptschrift; gedämpfte und ruhige Schriftfarben tragen Erläuterungen. Linien trennen Inhalte ohne helle Rahmen. Die beiden Einstiegswege besitzen eigene blaugrüne beziehungsweise warme Flächentöne; diese bleiben lokale Akzente.

**The Gold as Wayfinding Rule.** Gold priorisiert Aktionen und Orientierung; lange Lesetexte bleiben elfenbeinfarben.

## Typography

Cinzel und Source Sans 3 werden lokal ausgeliefert. Cinzel trägt Marke, Hero und Abschnittsüberschriften; Source Sans 3 übernimmt Navigation, Kartentitel und Fließtext. Die normativen Rollen stehen im Frontmatter.

Der zweizeilige Titel „AION 2 / Academy“ verwendet die Display-Rolle. Bis 960px gilt 76px; bis 700px gilt clamp(48px, 13vw, 72px) mit Zeilenhöhe 1.02. Abschnittstitel verwenden die Headline-Rolle mit Zeilenhöhe 1.25. Einstiegstitel sind 23px/1.25, Themenzeilen 22px/1.25 und mobil 21px. Die Hero-Einleitung ist 21px/1.55, mobil 19px. Die Hauptaktion ist 17px/1.4 bei Gewicht 600. Suchlabel sind 20px/600, Suchtext 18px, Filter 16px und Ergebniszähler 15px.

Guide-H1 skaliert mit clamp(32px, 4vw, 44px), mobil 32px; Guide-H2 ist 28px. Beide verwenden Cinzel mit Zeilenhöhe 1.3. Guide-Fließtext bleibt bei 18px/1.75 und maximal 72ch. Metadaten sind 15px, Hinweistext 17px. Die Navigationsmarke verwendet 19px mit 0.12em Laufweite. Kleine Größen dienen Metadaten; zentrale Beschreibungen bleiben 17–18px.

## Layout

Die Startseite nutzt einen 1320px breiten Außencontainer mit 40px Seitenpolster. Bis 960px sinkt das Polster auf 32px, bis 700px auf 20px. Der Hero ist mindestens 580px hoch; mobil mindestens 570px mit nach unten ausgerichtetem Text und oben sichtbarer Zitadelle.

Die zwei Einstiege stehen nebeneinander. Der Themenbereich kombiniert eine schmalere, ab 116px klebende Such- und Filterspalte mit einer breiteren Ergebnisliste: minmax(260px, .7fr) zu minmax(0, 1.3fr), mit 64px Zwischenraum. Bis 960px gilt 1fr zu 1.4fr mit 32px Abstand. Bis 700px werden Einstiege, Themenbereich, Beispielbereich und Routineverweise einspaltig; die Suchsteuerung ist dann nicht klebend. Ergebniszeilen haben 8px Abstand. Große Abschnitte nutzen 80–88px Abstand, mobil 52px.

Guide-Seiten behalten VitePress-Seitennavigation, Inhaltsverzeichnis und vorherigen/nächsten Guide. Die Navigation ist 80px hoch, bis 700px 64px. Zwischen 768px und 1100px zeigt die Navigationssuche nur die Lupe als 44px große Schaltfläche; Suchtext und Tastenkürzel entfallen in diesem Bereich.

## Elevation & Depth

Tiefe entsteht durch Tonwerte, feine Trennlinien und den dunklen Verlauf vor der Zitadelle. Die eigenen Karten verwenden keine Schatten und keine Hover-Verschiebung. Hover hellt ihre Fläche in 0.2s auf; das Suchdialogverhalten folgt VitePress. Bei reduzierter Bewegung entfallen Übergänge, Animationen und weiches Scrollen.

## Shapes

Bedienelemente sind zurückhaltend gerundet, Karten weicher. Die Radien stehen im Frontmatter; Hinweisflächen und Bilder verwenden die mittlere Stufe. Linien sind überwiegend 1px stark. Tastaturfokus erhält eine 2px helle Goldkontur mit 5px Abstand. Ikonen bleiben einfache Linienzeichen; die kleine Legionsmarke ist eine eigenständige Identitätsmarke.

## Components

- **Hauptaktion:** Goldfläche, dunkle Schrift, mindestens 48px Höhe, 17px/600 und 20px Pfeil. Hover wird hellgolden.
- **Themensuche:** beschriftetes Suchfeld, eigene tonale Fläche und gemeinsamer Fokusrahmen. Es durchsucht die Themenbezeichnungen, Beschreibungen und Suchwörter. Die globale Lupe durchsucht weiterhin alle Seiten.
- **Themenfilter:** tonale Schaltflächen mit mindestens 44px Höhe. Goldfläche und aria-pressed vermitteln die Auswahl. Der Ergebniszähler meldet Änderungen; ein leerer Zustand bietet „Alle Themen anzeigen“. Suche und Filter bleiben über suche und thema in der URL erhalten und werden bei Browsernavigation wiederhergestellt.
- **Themenzeile:** ganzflächiger Link, 22px Titel, 17px Beschreibung und goldener Pfeil. Wechselnde dunkle Flächen gliedern die Liste; Hover hellt sie auf. Mobil erhält die Zeile 20px Polster.
- **Einstiegsweg:** breite Karte mit kurzer Einordnung und Pfeil. Die erste Fläche ist kühl, die zweite warm. Bis 960px entfällt die führende Ikone; bis 700px stehen beide Karten untereinander.
- **Beispielbereich:** ruhige Zweiteilung mit Einordnung und dunklerer Leseprobe, mobil gestapelt. Die verlinkte Beispielseite zeigt die spätere Leseführung.
- **Routineverweis:** drei offene Textspalten mit goldenen Titeln und konkreten Beschreibungen; mobil untereinander.
- **Guide-Hinweis:** tonale Fläche ohne Rand, 22px/26px Polster und 17px Erklärungstext. Metadaten umbrechen über einer unteren Trennlinie; aufklappbare Details verwenden eine eigene dunkle Fläche.
- **Navigation und Suche:** VitePress-Steuerung mit eigener Marke, dunklem Hintergrund und lokaler Volltextsuche. Die kompakte Tabletsuche hält Marke und Navigation frei.

## Do's and Don'ts

### Do:
- Do die originale Zitadelle als Atmosphäre verwenden und Text durch dunkle Verläufe lesbar halten.
- Do sichtbaren Tastaturfokus und mindestens 44px hohe Filterziele erhalten.
- Do Vorschau- und Migrationsstatus klar sichtbar halten.
- Do die reduzierte Bewegung respektieren.

### Don’t:
- Don’t Spielmechaniken durch atmosphärische Bilder belegen.
- Don’t offizielle Spieloberflächen, Siegel oder unbelegte Fortschrittswerte imitieren.
- Don’t Cinzel für lange Fließtexte einsetzen.

