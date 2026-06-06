# MT Rankings – Routen und Informationsarchitektur

## Projektbeschreibung

MT Rankings ist eine SvelteKit-Webanwendung für den Vergleich von Muay-Thai-Rankings aus verschiedenen Organisationen. Die App richtet sich an Fans, Journalisten und Trainer, die Rankings von WBC Muay Thai und der Rajadamnern World Series (RWS) an einem Ort vergleichen möchten.

Der Prototyp fokussiert auf einen klar strukturierten End-to-End-Workflow: Startseite → Organisation wählen → Gewichtsklasse wählen → Ranking-Liste → Fighter-Detailseite → Favorit verwalten.

---

## Datenarchitektur

Ranking- und Fighter-Daten werden über einen XML-basierten Scraper-Prozess in MongoDB übertragen:

1. **XML-Quelldateien** (`static/data/wbc_rankings.xml`, `static/data/rws_rankings.xml`) enthalten Fighter-Stammdaten und Ranking-Einträge, strukturiert nach Organisationen und Gewichtsklassen.
2. **Sync-Endpunkte** (`/api/admin/scrape`, `/api/admin/scrape/rws`) lesen die XML-Dateien, führen Fighter-Dedup-Logik aus und schreiben die Daten per Upsert in MongoDB.
3. **SvelteKit-Load-Funktionen** lesen ausschliesslich aus MongoDB und liefern die Daten als Props an Svelte-Komponenten.

Benutzerspezifische Daten (Konten, Favoriten) werden direkt in MongoDB gespeichert und nie im XML abgelegt.

Die XML-Datenstruktur ist dokumentiert in:  
→ [xml-structure.md](xml-structure.md)

---

## Haupt-Workflow (End-to-End)

1. Benutzer öffnet die Startseite.
2. Benutzer navigiert zur Rankings-Seite.
3. Benutzer wählt eine Organisation via Tab (P4P World / WBC Muay Thai / RWS).
4. Bei WBC/RWS: Benutzer wählt eine Gewichtsklasse via Dropdown.
5. Benutzer sieht die Ranking-Liste für die gewählte Organisation und Gewichtsklasse.
6. Benutzer klickt einen Fighter-Namen in der Ranking-Liste.
7. Benutzer öffnet die Fighter-Detailseite mit Profil und allen Ranking-Einträgen des Fighters.
8. Der Favoriten-Button ist auf der Fighter-Detailseite sichtbar.
9. Nicht eingeloggte Benutzer sehen den Button als deaktiviert; eingeloggte Benutzer können ihn speichern.
10. Eingeloggte Benutzer können die Favoritenliste öffnen.

---

## Navigation nach Rolle

Die Navbar passt sich dem Login-Status des Benutzers an:

| Navigationselement | Gast | Eingeloggter User | Admin |
|---|:---:|:---:|:---:|
| Rankings | ✅ | ✅ | ✅ |
| Fighters | — | ✅ | ✅ |
| Favourites | — | ✅ | — |
| Admin | — | — | ✅ |
| Login | ✅ | — | — |
| Register | ✅ | — | — |
| Logout | — | ✅ | ✅ |

Admins sehen keine Favoritenliste (diese ist für die persönliche Nutzung als normaler User gedacht).

---

## Routen-Übersicht

| Route | Zweck | Zugang |
|---|---|---|
| `/` | Startseite (3 rollenabhängige Ansichten) | Public |
| `/rankings` | Ranking-Browser mit Org-Tabs und Gewichtsklassen-Dropdown | Public |
| `/fighters` | Fighter-Verzeichnis mit Suche, Filter und Sortierung | Public |
| `/fighters/[id]` | Fighter-Detailseite mit Profil, Ranking-Einträgen und Favoriten-Button | Public |
| `/favorites` | Persönliche Favoritenliste (Kartenansicht) | Nur eingeloggte User |
| `/account` | Profilbearbeitung und Passwortänderung | Nur eingeloggte User |
| `/login` | Login-Formular | Public |
| `/register` | Registrierungsformular | Public |
| `/admin` | Admin-Panel (tab-basiert) | Nur Admins |
| `/logout` | POST-Endpunkt zum Abmelden, leitet danach auf `/` weiter | Eingeloggte User |
| `/api/admin/scrape` | POST – WBC-XML-Sync in MongoDB | Nur Admins |
| `/api/admin/scrape/rws` | POST – RWS-XML-Sync in MongoDB | Nur Admins |

---

## Einzelne Routen im Detail

### `/` – Startseite

Die Startseite zeigt je nach Login-Status drei verschiedene Ansichten:

**Gast-Ansicht:**
- Hero-Bereich mit App-Titel und Kurzbeschreibung
- Feature-Cards (Rankings, Fighters, Search)
- Call-to-Action mit Login- und Register-Links

**User-Ansicht (eingeloggt):**
- Scrollender Ankündigungs-Banner (sofern aktiv)
- Bild-Carousel mit automatischem Wechsel alle 4 Sekunden
- Willkommen-Gruss mit Benutzername
- Schnellzugriff auf die letzten 3 Favoriten
- Action-Cards für Rankings und Fighter Browser

**Admin-Ansicht:**
- Dashboard mit 5 Stat-Cards: Anzahl Fighter, Anzahl Ranking-Listen, Anzahl User, letzter WBC-Sync-Zeitstempel, letzter RWS-Sync-Zeitstempel
- Donut-Diagramm (SVG): Fighter-Verteilung nach Organisation (WBC / RWS / Other)
- Link zum Admin-Panel

---

### `/rankings` – Ranking-Browser

Der Rankings-Browser besteht aus zwei Ebenen:

**Tab-Navigation (Organisation):**
- Tab «P4P World» – redaktionelles Pound-for-Pound-Ranking (immer als erster Tab)
- Tabs für jede Organisation aus MongoDB (`organisations`-Collection)

**Bei WBC/RWS-Tabs:**
- Dropdown zur Gewichtsklassen-Auswahl (Gewichtsklassen gehören zur jeweiligen Organisation)
- Ranking-Liste mit Positionen und klickbaren Fighter-Namen
- Bei leerem Ranking: Statusmeldung

**P4P-Tab:**
- Tabelle mit Position, Fighter-Name, Nationalität und optionaler Notiz
- Zeigt Flaggen-Emojis und Organisations-Zugehörigkeit pro Kämpfer
- Bei noch nicht veröffentlichtem Ranking: Platzhaltermeldung

URL-Parameter steuern den Zustand:
- `?organisation=org-wbc&weightClass=wbc-middleweight` für WBC/RWS
- `?tab=p4p` für das P4P-Ranking

---

### `/fighters` – Fighter-Browser

Übersichtsseite aller Kämpfer mit Interaktionsmöglichkeiten:

- **Textsuche** nach Kämpfername
- **Filter** nach Organisation (zeigt nur Orgs, in denen mindestens ein Fighter gelistet ist)
- **Filter** nach Gewichtsklasse (abhängig von gewählter Organisation)
- **Sortierung** nach Name oder Ranking-Position
- Ergebnisanzahl wird dynamisch aktualisiert
- Klick auf Fighter-Name öffnet die Detailseite `/fighters/[id]`

Im Admin-Modus (`isAdmin=true`) wird dieselbe `FighterBrowser`-Komponente mit inline Edit- und Delete-Formularen erweitert.

---

### `/fighters/[id]` – Fighter-Detailseite

- Anzeige der Fighter-Stammdaten: Name, Nationalität(en) mit Flaggen-Emojis, Alter, Rekord
- Tabelle aller Ranking-Einträge des Fighters (Org, Gewichtsklasse, Position)
- Favoriten-Button (Stern-Icon):
  - Gäste: Button sichtbar, aber deaktiviert mit Login-Hinweis
  - Eingeloggte User: Button aktiv, Toggle-Funktion (hinzufügen / entfernen)

---

### `/favorites` – Favoritenliste

- Nur zugänglich für eingeloggte User (Redirect auf `/login` wenn nicht angemeldet)
- Kartenansicht aller gespeicherten Kämpfer
- Jede Karte zeigt Name, Nationalität und ist mit der Fighter-Detailseite verlinkt
- Beim Entfernen eines Favoriten wird die Liste sofort aktualisiert

---

### `/account` – Accountverwaltung

- Nur zugänglich für eingeloggte User (Redirect auf `/login`)
- **Profil-Editing (inline):** Vorname, Nachname, Benutzername, E-Mail-Adresse – jedes Feld einzeln bearbeitbar mit Inline-Validierung
- **Passwortänderung:** separates Formular mit aktuelles Passwort, neues Passwort, Bestätigung

---

### `/login` und `/register`

- Standard-Authentifizierungsformulare
- Login per **E-Mail oder Benutzername** + Passwort
- Registrierung: Vorname, Benutzername, E-Mail, Passwort
- Nach erfolgreichem Login oder Registrierung: Redirect auf Startseite `/`
- Eingeloggte Benutzer werden automatisch auf `/` weitergeleitet

---

### `/admin` – Admin-Panel

Geschützt über `src/routes/admin/+layout.server.js` (Redirect auf `/` wenn kein Admin-Zugang). Das Admin-Panel ist eine Single-Page-Anwendung mit Tab-Navigation:

| Tab | Inhalt |
|---|---|
| **Users** | Benutzerliste; Rolle ändern (user/admin); Benutzer löschen |
| **Fighters** | Fighter-Browser mit inline Edit-Formular (Name, Nationalitäten, Alter, Rekord) und Delete-Button; verwendet die `FighterBrowser`-Komponente mit `isAdmin=true` |
| **P4P Ranking** | Editor für das P4P World Ranking: bis zu 10 Kämpfer auswählbar via Suchfeld-Dropdown, optionale Notiz pro Eintrag, bereits verwendete Kämpfer werden in anderen Slots ausgeblendet |
| **Announcement** | Eingabefeld für den scrollenden Ankündigungs-Banner auf der User-Startseite |

Auf der Admin-**Startseite** (`/`) – nicht im Admin-Panel – befindet sich das Dashboard mit Statistiken und Donut-Diagramm sowie der Link zu `/admin`.

---

### `/api/admin/scrape` und `/api/admin/scrape/rws`

POST-Endpunkte, die den Sync-Prozess auslösen:

1. XML-Datei aus `static/data/` lesen
2. XML parsen: Organisationen, Fighter, Rankings
3. Organisationen per `replaceOne` in MongoDB upserten
4. Fighter dedup + upserten (Details → xml-structure.md)
5. Rankings per `replaceOne` upserten
6. Eingebettete `rankings[]`-Einträge auf Fighter-Dokumente aktualisieren

Beide Endpunkte erfordern Admin-Authentifizierung. Bei Erfolg gibt der Endpunkt Anzahl verarbeiteter Fighter und Rankings zurück.

---

### `/logout`

POST-Endpunkt. Löscht das Session-Cookie und leitet auf `/` weiter. Wird über ein `<form method="POST">` in der Navbar aufgerufen.
