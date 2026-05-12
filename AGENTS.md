# AGENTS.md

## Projektkontext

Dieses Projekt ist eine prototypische Webanwendung für das Modul Prototyping an der ZHAW.  
Die Anwendung wird mit SvelteKit umgesetzt und basiert auf dem Projektkonzept **MT Rankings / Muay Thai Rankings**.

Ziel der Anwendung ist es, Muay-Thai-Rankings verschiedener Organisationen übersichtlich darzustellen und Nutzerinnen und Nutzern einen klaren End-to-End-Workflow zu ermöglichen.

Die Anwendung soll die Anforderungen der ZHAW-Prototyping-Aufgabe erfüllen:

- klar definierter Hauptworkflow
- mindestens eine Übersichtsseite mit Daten aus einer Datenbank
- mindestens eine Seite zum Erfassen oder Bearbeiten von Daten
- Umsetzung mit SvelteKit und Komponenten
- Persistenz mit MongoDB
- Versionsverwaltung mit Git/GitHub
- Deployment, zum Beispiel mit Netlify
- verständliche Navigation, sichtbares Feedback und gute Bedienbarkeit
- laufende Pflege der README.md

## Projektidee

Die Webanwendung heisst **MT Rankings**.

Sie beschäftigt sich mit dem Problem, dass Muay-Thai-Rankings je nach Organisation unterschiedlich aufgebaut sind. Organisationen wie RWS, ONE Championship und WBC Muay Thai führen eigene Rankings mit unterschiedlichen Kriterien. Dadurch ist es für Fans, Kämpfer, Coaches und Analysten schwierig, Kämpfer organisationsübergreifend zu vergleichen.

Die Anwendung soll Rankings zentral darstellen und eine verständliche Nutzerführung bieten.

## Hauptworkflow

Der zentrale Hauptworkflow lautet:

1. Nutzer öffnet die Startseite.
2. Nutzer wechselt über die Navigation zur Ranking-Seite.
3. Nutzer sieht eine Übersicht von Kämpfern beziehungsweise Rankings.
4. Nutzer klickt auf einen Kämpfer.
5. Nutzer gelangt auf die Detailseite des Kämpfers.
6. Nutzer sieht zusätzliche Informationen zum Kämpfer.
7. Nutzer kann den Kämpfer als Favorit markieren.
8. Falls der Nutzer nicht eingeloggt ist, erscheint ein Hinweis, dass die Favoritenfunktion nur nach Login verfügbar ist.
9. Falls der Nutzer eingeloggt ist, wird der Kämpfer zur Favoritenliste hinzugefügt.
10. Nutzer kann seine Favoriten auf einer separaten Favoriten-Seite ansehen.

Der Workflow muss im Prototyp mindestens teilweise funktionsfähig umgesetzt werden. Wichtig ist, dass der Ablauf von Start bis Ziel nachvollziehbar ist.

## Mindestanforderungen für die Umsetzung

Der KI-Agent soll beim Arbeiten am Projekt immer darauf achten, dass die folgenden Mindestanforderungen erfüllt werden:

### SvelteKit

- Die Anwendung muss mit SvelteKit umgesetzt werden.
- Die Routen sollen klar strukturiert sein.
- Wiederverwendbare UI-Elemente sollen als Komponenten ausgelagert werden.
- Der Hauptworkflow muss funktionieren.
- UI-Feinschliff kommt erst nach der stabilen Umsetzung des Hauptworkflows.

### MongoDB

- Die Anwendung muss Daten aus MongoDB verwenden.
- Mindestens eine Übersichtsseite muss Daten aus der Datenbank anzeigen.
- Mindestens eine Seite muss das Erfassen oder Bearbeiten von Daten ermöglichen.
- Beispiele für gespeicherte Daten:
  - Fighters
  - Rankings
  - Organisations
  - Favorites
  - Users, falls Login simuliert oder umgesetzt wird

### Git und GitHub

- Änderungen sollen klein und nachvollziehbar umgesetzt werden.
- Der Agent soll keine unnötig grossen Änderungen auf einmal machen.
- Nach sinnvollen Arbeitsschritten sollen Commit-Vorschläge gemacht werden.
- Commit-Messages sollen klar beschreiben, was geändert wurde.

Beispiele:

```bash
git add .
git commit -m "Add fighter ranking overview page"
git commit -m "Create fighter detail page workflow"
git commit -m "Add MongoDB connection for rankings"
git commit -m "Update README with setup instructions"