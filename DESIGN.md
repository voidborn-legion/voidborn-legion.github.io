---
name: Voidborn Academy
description: Bestätigte dunkle Voidborn-Gestaltung mit glutroten Akzenten
colors:
  night: "#0b0c0e"
  night-alt: "#101113"
  surface: "#141517"
  raised: "#1a1b1e"
  text: "#eeece7"
  muted: "#b7b5b4"
  quiet: "#a6a6aa"
  line: "#2a2b2e"
  accent: "#ed7869"
  accent-hover: "#f29b8f"
  accent-deep: "#b8453a"
  accent-surface: "#291a19"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(43px, 4.8vw, 68px)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  document-title:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(32px, 3.6vw, 48px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "18px"
    lineHeight: 1.85
rounded:
  control: "3px"
  note: "3px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  section: "46px"
---

# Voidborn Academy

Der Nutzer hat am 25.10.2026 das eigene Spalt-/Obsidian-Motiv, den dunklen Grund und die Typografie bestätigt und Glutrot gewählt. Die frühere Gold-/Navy-Gestaltung ist für die öffentliche Website abgelöst. Der grüne Entwurf bleibt Vergleichsmaterial.

## Visuelle Identität

Das aus der Leere aufbrechende Gestein trägt die Startseite und erscheint nur abgeschwächt hinter Guide-Titeln. Das monochrome Artwork wurde eigens erzeugt. Keine fremden Guide-Artworks kopieren. Rot bleibt auf Marke, hervorgehobene Titelteile, Links, aktive Zustände und Fokus begrenzt. Keine roten Fließtextflächen, keine flächigen Leuchteffekte.

Cinzel trägt Marke und Haupttitel. Source Sans 3 trägt Navigation, Abschnitte und längere Texte; alle Fonts lokal. Dokumente haben etwa 74 Zeichen Zeilenlänge. Sekundäre Informationen bleiben lesbar und erhalten keine dekorativen Versalien.

## Seiten und Bausteine

Die Startseite kombiniert Suchanliegen, echte Themenfilter und eine Themenliste. Ein hervorgehobener Guide verweist im öffentlichen Modus ausschließlich auf eine öffentliche Seite; die lokale Redaktionsvorschau darf auf den benannten Entwurf verlinken. Filterzustand und Suchbegriff werden in der URL gespeichert.

Guide-Seiten behalten den VitePress-Inhalt, Volltextsuche, direkte Abschnittslinks und Inhaltsverzeichnis. Die linke permanente Themenleiste entfällt; zur Themenübersicht führt ein Rücklink. Auf breiten Ansichten steht das Inhaltsverzeichnis rechts, schmalere Ansichten verwenden die VitePress-Seitenübersicht.

Kurzantworten und Hinweise verwenden flache Flächen. Tabellen haben transparente Zellen und ruhige Zeilentrenner. Klappboxen sind visuell bearbeitbare Markdown-Inhalte, keine Komponenten im Guide-Text. Bilder bleiben vergrößerbar; Galerie und Pet-Werte-Komponenten sind erhalten.

## Responsive und Bedienung

Startseite maximal 1400px, Desktop-Innenabstand 55px, Tablet 30px, Mobil 23px. Der bebilderte Kopf ist auf Mobil schmaler, das Motiv tritt hinter dem Text zurück. Themenliste und Guide-Hinweis werden untereinander angeordnet. Lesetext mobil 17px, Dokumenttitel 32px. Tastaturfokus rot, Suche und Filter beschriftet. Navigation erhält sofortige Seitensprünge; reduzierte Bewegung wird respektiert.

## Geltungsbereich

Diese Grundlage ist in `docs/.vitepress/theme/voidborn.css` umgesetzt. Das alte Stylesheet bleibt vorerst für bestehende Hilfskomponenten geladen; neue Vorgaben überschreiben dessen Farben und Formate. Das bestehende Academy Studio wird erst anschließend an diese Identität angepasst. Sein vollständiger Editor, Rechte, Kommentare, Versionen und Medien dürfen dabei nicht verloren gehen.

Entwürfe bleiben von öffentlichen Builds ausgeschlossen. Die lokale Redaktionsvorschau ist sichtbar markiert und erlaubt genau den benannten Ausrüstungsentwurf. Gestaltung und sprachliche Überarbeitung stellen keine fachliche Bestätigung von Spielwerten dar.

