---
title: Editor-Hilfe
---

# So bearbeitest du einen Guide

Wähle links **Guides**, öffne einen Beitrag und scrolle zu **Inhalt**. Dort kannst du zwischen zwei Ansichten wechseln:

- **Editor:** Text wie in einem Schreibprogramm bearbeiten. Hier fügst du Bilder und Tabellen über ein Menü ein.
- **Source:** Den Markdown-Text bearbeiten. Hier fügst du die Vorlagen für Klappboxen und Infoboxen ein.

## Ein Bild einfügen

1. Wähle bei **Inhalt** die Ansicht **Editor**.
2. Klicke an die gewünschte Stelle und drücke **Enter**, sodass eine leere Zeile entsteht.
3. Tippe **/** und wähle **Image**.
4. Wähle im Bilddialog dein Bild aus und bestätige die Auswahl. Bilder kannst du auch links unter **Media** verwalten.

## Eine Tabelle einfügen

1. Wechsle auf **Editor** und klicke in eine leere Zeile.
2. Tippe **/** und wähle **Table**.
3. Klicke in die Zellen und trage deine Werte ein.

Überschriften, Aufzählungen und Zitate findest du im selben Menü.

## Eine Klappbox einfügen

1. Öffne deinen Guide und wechsle bei **Inhalt** auf **Source**.
2. Kopiere den gesamten folgenden Block an die gewünschte Stelle. Lass davor und danach eine Leerzeile.
3. Ersetze **Meine Frage** durch deinen Titel und den Beispieltext durch deine Erklärung. Lass die beiden Zeilen mit den drei Doppelpunkten stehen.

```text
::: details Meine Frage

Hier steht die Antwort. Sie wird sichtbar, wenn jemand die Box öffnet.

:::
```

Auf der Website sieht man zunächst nur **Meine Frage**. Beim Anklicken öffnet sich die Antwort. Im CMS siehst du weiterhin die Textmarkierungen; das ist normal.

## Eine Infobox einfügen

Wechsle auf **Source**, kopiere diesen Block und ersetze Titel und Hinweistext:

```text
::: info Gut zu wissen

Hier steht dein Hinweis.

:::
```

Die Infobox ist auf der Website sofort sichtbar. Du kannst in der ersten Zeile **info** ersetzen:

| Markierung | Verwenden für |
| --- | --- |
| info | Eine zusätzliche Erklärung |
| tip | Einen praktischen Tipp |
| warning | Eine Warnung, etwa vor Ressourcenverbrauch |
| danger | Einen besonders wichtigen Warnhinweis |

Der Titel danach ist frei wählbar, zum Beispiel `::: tip Vor dem nächsten Run`.

## Text hervorheben und Links setzen

Im **Editor** kannst du Text markieren und das Formatierungsmenü verwenden. In **Source** schreibst du:

| Gewünscht | In Source eingeben |
| --- | --- |
| Fett | `**wichtiger Text**` |
| Kursiv | `*betonter Text*` |
| Link zu einer Website | `[Quelle öffnen](https://beispiel.de)` |
| Link zum Pets-Guide | `[Zum Pets-Guide](./pets)` |
| Abschnittsüberschrift | `## Meine Überschrift` |
| Unterüberschrift | `### Mein Unterpunkt` |

## Speichern und auf der Website ansehen

1. Prüfe oben **Veröffentlichung**: Bei **Veröffentlicht** geht deine Änderung nach dem Speichern automatisch online. Bei **Entwurf** erscheint der Guide nicht auf der Website.
2. Klicke **Save**. Warte, bis der Speichervorgang beendet ist.
3. Die Website wird anschließend neu gebaut. Öffne sie nach Abschluss der Veröffentlichung und lade den Guide neu.

**Wichtig:** Auch Entwürfe sind im öffentlichen GitHub-Repository lesbar. Trage keine privaten Kommentare oder Zugangsdaten ein.

## Wenn eine Box nicht richtig aussieht

- Die Anfangszeile und die Abschlusszeile `:::` müssen jeweils allein in ihrer Zeile stehen.
- Kopiere die Vorlage ohne die äußeren Codeblock-Markierungen.
- Verwende keine HTML-Tags wie `<details>` oder `<summary>`; der visuelle Editor kann sie entfernen.
- Die Website stellt Boxen dar. Pages CMS zeigt deren Markdown-Markierungen, auch in der Ansicht Editor.
