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
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(42px, 4.4vw, 66px)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Cinzel, serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.3
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
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  filter-selected:
    backgroundColor: "{colors.legion-gold}"
    textColor: "#10151c"
  topic-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.card}"
    padding: "28px"
  topic-card-hover:
    backgroundColor: "#1b2836"
---

# Design System: Voidborn Academy

## Overview

**Creative North Star: "Nächtlicher Legionsatlas"**

Ein nächtlicher Legionsatlas: atmosphärisch im Einstieg, präzise in der Orientierung und ruhig beim Lesen. Dunkle blaue Flächen, elfenbeinfarbene Schrift und sparsam eingesetztes Gold verbinden die Academy mit Voidborn. Die originale Fantasy-Zitadelle trägt die Stimmung; sie ist kein Beleg für Spielmechaniken.

Die Website ist eine technische Vorschau vor der Discord-Migration. Hinweisflächen und Guide-Platzhalter kennzeichnen diesen Stand sichtbar. Das System übernimmt VitePress-Leseführung und lokale Suche, während die Startseite zwei Einstiegswege, filterbare Themen und zurückhaltende Routineverweise anbietet.

**Key Characteristics:**
- Nächtliche Flächen mit klarer Lesbarkeit
- Cinzel als Akzent, Source Sans 3 als Arbeitsstimme
- Gold für Orientierung und ausgewählte Aktionen
- Tonal geschichtete Karten ohne schwebende Effekte

## Colors

### Primary
Legionsgold markiert Hauptaktionen, ausgewählte Filter, Verweise und ikonografische Wegweiser. Das hellere Gold signalisiert Hover und Tastaturfokus; das tiefere Gold gehört zur VitePress-Markenfamilie.

### Neutral
Nachtschwarz trägt die Seite und Navigation. Die alternative Nachtfläche, die weiche Fläche und die erhöhte Fläche staffeln Navigation, Karten und Tabellen. Elfenbein ist die Hauptschrift; gedämpfte und ruhige Schriftfarben tragen Erläuterungen. Linien trennen Inhalte ohne helle Rahmen. Die beiden Einstiegswege besitzen eigene blaugrüne beziehungsweise warme Flächentöne; diese bleiben lokale Akzente.

**The Gold as Wayfinding Rule.** Gold priorisiert Aktionen und Orientierung; lange Lesetexte bleiben elfenbeinfarben.

## Typography

Cinzel und Source Sans 3 werden lokal ausgeliefert. Cinzel trägt Marke, Hero und Abschnittsüberschriften; Source Sans 3 übernimmt Navigation, Kartentitel und Fließtext. Die normativen Rollen stehen im Frontmatter.

Der Hero verwendet die Display-Rolle; bis 960px wird er 50px groß, bis 640px skaliert er mit clamp(34px, 9vw, 46px) und Zeilenhöhe 1.16. Guide-H1 skaliert mit clamp(32px, 4vw, 44px); Guide-H2 ist 28px, mobil 25px. Startseiten-Abschnittstitel sind mobil 25px. Guide-Fließtext läuft mit maximal 72ch; Kartenbeschreibungen verwenden 17px/1.6. Die Marke erhält 19px und 0.12em Laufweite.

## Layout

Die Startseite nutzt einen 1320px breiten Außencontainer einschließlich 40px Seitenpolster: 1240px nutzbarer Inhalt. Unter 960px sinkt das Polster auf 32px, unter 640px auf 20px. Der Hero ist mindestens 640px hoch, ab 1600px 700px; mobil mindestens 620px mit Text unterhalb des oberen Bildausschnitts.

Zwei Einstiegswege bilden zwei Spalten, Themen drei. Unter 960px werden Themen zweispaltig; unter 640px stehen Wege, Themen und Routinebereich einspaltig. Filter umbrechen. Die Hauptaktion füllt mobil die verfügbare Breite. Kleine Abstände orientieren sich an 8/16/24px; Themenkarten haben 20px Rasterabstand. Abschnittsabstände betragen je nach Funktion 64 oder 80px und werden mobil reduziert.

Guide-Seiten behalten VitePress-Seitennavigation, Inhaltsverzeichnis und vorherigen/nächsten Guide. Die lokale Volltextsuche ist deutsch beschriftet. Die Navigation ist 80px hoch, unter 640px 64px.

## Elevation & Depth

Tiefe entsteht durch Tonwerte, feine Trennlinien und den dunklen Verlauf vor der Zitadelle. Die eigenen Karten verwenden keine Schatten und keine Hover-Verschiebung. Hover hellt ihre Fläche in 0.2s auf; das Suchdialogverhalten folgt VitePress. Bei reduzierter Bewegung entfallen Übergänge, Animationen und weiches Scrollen.

## Shapes

Bedienelemente sind zurückhaltend gerundet, Karten weicher. Die Radien stehen im Frontmatter; Hinweisflächen und Bilder verwenden die mittlere Stufe. Linien sind überwiegend 1px stark. Tastaturfokus erhält eine 2px helle Goldkontur mit 5px Abstand. Ikonen bleiben einfache Linienzeichen; die kleine Legionsmarke ist eine eigenständige Identitätsmarke.

## Components

- **Hauptaktion:** goldene Fläche, dunkle Schrift, 16px/600, mindestens 48px Höhe und optionaler 20px Pfeil. Hover wird hellgolden.
- **Textaktion:** mindestens 48px hoch, helle Schrift und zurückhaltender Richtungshinweis; Hover wird hellgolden.
- **Themenfilter:** umrissene Schaltflächen mit mindestens 44px Höhe. Auswahl wird durch Goldfläche und aria-pressed vermittelt; Ergebnisse werden für assistive Technik angekündigt.
- **Themenkarte:** gesamte Fläche ist ein Link. 30px Linienikone, 22px Titel, Erläuterung und unten verankerter goldener Linkhinweis. Mindesthöhe 250px, mobil 210px mit 24px Polster.
- **Einstiegsweg:** breite, horizontal aufgebaute Karte mit Ikone, Titel, kurzer Einordnung und Pfeil. Mobile Stapelung betrifft das Raster, nicht den Karteninhalt.
- **Routineverweis:** ruhige zweizeilige Linkliste mit Trennlinien; Hover färbt den Titel golden.
- **Guide-Hinweis:** tonale Fläche mit feiner Kontur, 20px/24px Polster und kleinerem Erklärungstext. Metadaten verwenden eine ruhige, umbrechende Zeile mit unterer Trennlinie.
- **Navigation und Suche:** Standard-VitePress-Steuerung mit eigener Marke, dunklem Hintergrund und lokaler Suche. Keine eigene Suchlogik oder abweichenden Leseschienen erfinden.

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
