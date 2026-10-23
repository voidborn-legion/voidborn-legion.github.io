---
name: Voidborn Academy Studio
description: Redaktionelle Arbeitsfläche im nächtlichen Legionsatlas
colors:
  gold: "#d7b777"
  gold-hover: "#ebd1a0"
  night: "#0c1118"
  navigation: "#101720"
  surface: "#121a24"
  raised: "#18222d"
  ivory: "#eeeae2"
  muted: "#adb8c6"
  line: "#293341"
  action-ink: "#151b22"
  field: "#141e29"
  field-border: "#414d5c"
  selected: "#29271f"
  selected-text: "#f0d7a4"
  warning: "#29251e"
  warning-text: "#e5cb9d"
  error: "#312020"
  error-text: "#f3d2cc"
  success: "#182820"
  success-text: "#c9e6d8"
typography:
  brand:
    fontFamily: "Cinzel, serif"
    fontSize: "18px"
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "17px"
    lineHeight: 1.8
  label:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "15px"
  metadata:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  field: "4px"
  control: "5px"
  box: "6px"
  dialog: "9px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  desktop-inset: "42px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
    padding: "9px 17px"
    height: "43px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  navigation-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.selected-text}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
---

# Design System: Voidborn Academy Studio

## Overview

**Creative North Star: „Nächtlicher Legionsatlas“ — redaktionelle Arbeitsfläche.**

Das Studio erweitert die bestehende Voidborn-Identität um eine ruhige Arbeitsoberfläche. Nachtflächen, elfenbeinfarbene Schrift und Gold bleiben erhalten. Cinzel kennzeichnet die Marke; Source Sans 3 trägt die gesamte redaktionelle Arbeit. Dieses Dokument gilt ausschließlich für `studio/`; das übergeordnete DESIGN.md bleibt die Autorität der öffentlichen Website.

**Key Characteristics:**
- Dauerhafte Navigation und eine klare Hauptarbeitsfläche.
- Listen, Tabellen und lesbarer Editor statt dekorativer Kennzahlen.
- Sichtbare Entwurfs-, Prüf- und Zugriffsstände.
- Lucide-Linienikonen mit Text für zentrale Aktionen.

## Colors

### Primary
Legionsgold markiert Hauptaktionen, Links und Tastaturfokus. Der hellere Goldton signalisiert Hover. Die ausgewählte Navigation erhält eine zurückhaltende warme Fläche.

### Neutral
Die Nachtfläche trägt den Arbeitsbereich. Navigation, erhöhte Flächen und feine Linien gliedern ihn. Elfenbein trägt Hauptinhalte; gedämpfte Schrift erklärt Kontext. Warn-, Fehler- und Erfolgsflächen haben eigene warme, rote beziehungsweise grüne Tonwerte und immer einen Textstatus.

**The Gold as Wayfinding Rule.** Gold priorisiert Handlungen und Orientierung; lange Texte bleiben elfenbeinfarben.

## Typography

Die normativen Rollen stehen im Frontmatter. Die Marke verkleinert sich unter dem mittleren Breakpoint auf 16px. Seitenüberschriften werden mobil 30px groß. Der hervorgehobene Guide-Titel im Dashboard ist 31px, mobil 27px. Im Editor bleibt Fließtext bei 17px und maximal 75ch; Überschriften verwenden 34px, 26px und 21px. Markdown verwendet Consolas mit 15px und Zeilenhöhe 1.9, mobil 14px. Zahlen in Tabellen verwenden tabellarische Ziffern.

**The Working Voice Rule.** Cinzel bleibt an der Marke; Formulare, Tabellen, Überschriften und Guide-Inhalte verwenden die Arbeitsschrift.

## Layout

Desktop nutzt eine 242px breite klebende Seitennavigation und einen flexiblen Hauptbereich. Die Kopfleiste ist 78px hoch. Der Inhaltsbereich besitzt 42px Polster und maximal 1640px Breite. Dashboard-Inhalt und Kontext stehen im Verhältnis 1.8 zu 1 mit 36px Abstand. Die Kennzahlen sind eine zusammenhängende Leiste mit vier Bereichen.

Bei höchstens 1180px wird die Navigation 205px breit, das Inhaltspolster 30px/24px. Die Editor-Kontextspalte wandert unter das Dokument; Suchsteuerungen werden zweispaltig. Bei höchstens 760px steht die Navigation oben als horizontal scrollbarere Reihe. Dashboard, Editor-Kontext und Versionen werden einspaltig. Die Kennzahlen bilden zwei Spalten; Inhaltsränder sind 20px. Tabellen und die Markdown-Ansicht dürfen horizontal beziehungsweise intern scrollen. Aktionsgruppen umbrechen.

## Elevation & Depth

Tiefe entsteht durch Tonwerte und einpixelige Grenzen, ohne Kartenschatten. Die Werkzeugleiste bleibt über dem Editor klebend. Dialoge liegen auf einer abgedunkelten Vollbildfläche. Nur bei erlaubter Bewegung erscheinen Dialoge mit 7px vertikaler Bewegung über 0.16s; Links und Schaltflächen wechseln ihre Farbe über 0.15s ease-out.

## Shapes

Kleine Radien halten die Arbeitsfläche präzise. Statusmarken und Eingabefelder nutzen die kleinste Stufe, Schaltflächen die Kontrollstufe, redaktionelle Boxen die mittlere Stufe und Dialoge die weichste Stufe. Fehlende Bilder besitzen gestrichelte Grenzen und ein Linienbildzeichen. Fokus erhält eine goldene Kontur von 2px mit 3px Abstand.

## Components

- **Navigation:** Text und Lucide-Ikone; 47px Mindesthöhe, links ausgerichtet. Warm markierte Auswahl; mobile Reihe mit 43px Mindesthöhe.
- **Hauptaktion:** Goldfläche, dunkle Schrift, Gewicht 600; mindestens 43px hoch. Speichern benennt ausdrücklich den Entwurf. Deaktivierte Aktionen haben reduzierte Deckkraft und keinen aktiven Zeiger.
- **Listen und Tabellen:** Offene Zeilen mit unteren Trennlinien. Titel, Zuordnung, Status und Aktion bleiben gemeinsam lesbar. Tabellenköpfe verwenden eine erhöhte Nachtfläche.
- **Eingaben:** Sichtbare Labels, dunkle Füllung, feine helle Grenze und mindestens 42px Höhe. Suche kombiniert Lupe und Textfeld. Lange Inhalte dürfen umbrechen.
- **Guide-Auswahl:** Drei beschriftete Feldgruppen trennen „Guide suchen“, „Thema (Kategorie)“ und „Guide öffnen“. Ein Hilfesatz erklärt die Beziehung zwischen Thema und Beitrag. Die Lupe bleibt neben dem Suchtext in einer eigenen horizontalen Gruppe; globale Formularlabels dürfen sie nicht darüber verschieben. Auswahlfelder sind 44px hoch. Am mittleren Breakpoint belegt „Guide öffnen“ die ganze Reihe, mobil folgt es dem einspaltigen Raster.
- **Guide-Editor:** Umrandete Arbeitsfläche, klebende Werkzeugleiste, visuelle und Markdown-Ansicht. Status und Speichern stehen am Titel; Kommentar- und Verwaltungsaktionen im Kontext. Ungespeicherte Änderungen bleiben sichtbar.
- **Bildplatzhalter:** Ein eigener, verschiebbarer Inhaltsblock zeigt „Bild fehlt“, Titel und Beschreibung auf getönter Fläche mit gestrichelter Grenze. Einfügen erfolgt an der gemerkten Schreibposition und speichert den aktuellen Guide samt Titel und Zuordnung gemeinsam als Entwurf. Verschachtelte redaktionelle Boxen behalten beim Markdown-Wechsel getrennte Begrenzungen.
- **Bildzuordnung und Sprungziele:** Jede Screenshot-Zeile bietet einen sichtbaren Ziehhinweis und eine Upload-Schaltfläche. Beim Überziehen erhält die Zeile eine gestrichelte goldene Kontur; eine abgelegte gültige Datei öffnet den bestehenden Zuordnungsdialog mit Dateiname, Alternativtext und Bildunterschrift. „Zur Stelle“ zentriert eine eindeutig gefundene Textstelle, Box, einen Platzhalter oder ein Bild und markiert sie 4,5 Sekunden mit Goldkontur. Fehlende oder mehrdeutige Ziele erhalten eine erklärende Meldung.
- **Redaktionelle Box:** Getönte Fläche mit Titel und Grenze. Warnung und Gefahr verwenden die warme Warnfläche. Details zeigen einen Richtungsmarker vor dem Titel.
- **Dialog:** Maximal 600px breit und 90vh hoch mit eigenem Scrollbereich; mobil 95vh. Titel, beschriftete Felder, Abbrechen und Entwurfsaktion bilden die feste Reihenfolge.
- **Zustände:** Leere Bereiche erklären den tatsächlichen Datenstand. Fehler bieten den vorhandenen Wiederholungsweg. Der lokale Zugriff wird ausdrücklich benannt; Speichern ist kein Veröffentlichen.
- **Spieldaten-Hilfe:** Der Leerzustand erklärt gemeinsam gepflegte Spielwerte für Guide-Tabellen anhand von Brett, Slot und Min-/Max-Wert. Academy-Empfehlungen bleiben getrennt; ungeprüfte Entwurfswerte werden als solche benannt. Normaler Guide-Text benötigt diesen Bereich nicht.

Die ergänzten Arbeitskonventionen wurden aus dem Quelltext erfasst. Eine erneute visuelle Prüfung im Browser war durch dessen Sicherheitsrichtlinie blockiert; daraus folgt keine visuelle Freigabe.

## Do's and Don'ts

### Do:
- Do den lokalen Zugriffs- und Entwurfsstatus sichtbar halten.
- Do Listen und Guide-Arbeit gegenüber dekorativen Dashboardflächen priorisieren.
- Do Fokus und beschriftete Steuerungen erhalten; reduzierte Bewegung respektieren.
- Do fehlende, ungeprüfte und gespeicherte Inhalte in Worten kennzeichnen.

### Don't:
- Don't eine Veröffentlichung oder freigeschaltete GitHub-Anmeldung suggerieren, wenn sie nicht verfügbar ist.
- Don't ungeprüfte Spielwerte als bestätigt darstellen.
- Don't Cinzel für Arbeitsinhalte verwenden oder die öffentliche Website aus diesem Dokument umgestalten.
