# Projektdokumentation – MT Rankings

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen)
5. [Projektorganisation](#5-projektorganisation)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang](#7-anhang)

<!-- WICHTIG: DIE KAPITELSTRUKTUR DARF NICHT VERÄNDERT WERDEN! -->

---

## 1. Ausgangslage

- **Problem:** Muay Thai verfügt über mehrere konkurrierende Ranking-Organisationen – darunter WBC Muay Thai und die Rajadamnern World Series (RWS). Jede Organisation führt eigene Rankings mit unterschiedlichen Gewichtsklassenbezeichnungen, Gewichtslimiten und Titelbezeichnungen. Es gibt keine zentrale Plattform, auf der Fans, Journalisten und Trainer die Rankings verschiedener Organisationen übersichtlich vergleichen können. Derselbe Kämpfer kann in beiden Organisationen gelistet sein, ohne dass ein direkter Vergleich auf einer Seite möglich wäre.

- **Ziele:**
  - Aggregation von WBC Muay Thai und RWS Rankings in einer einzigen Webanwendung
  - Fighter-Profile organisationsübergreifend zusammenführen (ein Profil für alle Ranking-Einträge eines Kämpfers)
  - Klarer Workflow: Organisation wählen → Gewichtsklasse wählen → Ranking-Liste → Fighter-Detailseite → Favorit speichern → Favoritenliste
  - Redaktionelles Pound-for-Pound-Ranking (P4P) als ergänzendes Angebot
  - Ranking-Daten automatisiert per Scraper aktuell halten

- **Primäre Zielgruppe:** Muay-Thai-Fans, Sportjournalisten, Trainer und Kämpfer, die Rankings aktiv verfolgen und organisationsübergreifend vergleichen möchten

- **Weitere Stakeholder:** Kampfsport-Veranstalter (Sichtung von Titelanwärtern), Fight Promoter, Sportmedien

---

## 2. Lösungsidee

- **Kernfunktionalität:**  
  Die App bietet einen klar strukturierten Workflow für nicht angemeldete und angemeldete Benutzer:

  ```
  Startseite → Rankings → Organisation wählen (Tab)
             → Gewichtsklasse wählen (Dropdown)
             → Ranking-Liste → Fighter-Detailseite
             → Favorit speichern → Favoritenliste
  ```

  Zusätzlich gibt es ein organisationsübergreifendes Fighter-Verzeichnis mit Suche und Filter sowie ein redaktionelles P4P World Ranking.

- **Hauptfunktionen:**
  - Rankings nach Organisation (WBC Muay Thai, RWS) und Gewichtsklasse filtern
  - Fighter-Detailseiten mit Profil (Name, Nationalität, Alter, Rekord) und allen Ranking-Einträgen
  - Favoritensystem für eingeloggte Nutzer (MongoDB-Persistenz)
  - P4P World Ranking (redaktionell durch Admin verwaltbar, bis zu 10 Kämpfer)
  - Automatischer Scraper für WBC- und RWS-Daten (Python / Playwright)
  - Admin-Panel für Datenverwaltung, Fighter-CRUD und Inhaltspflege
  - Ankündigungs-Banner für aktuelle Mitteilungen (scrollender Ticker)

- **Annahmen:**
  - Muay-Thai-Fans sind bereit, sich für eine Favoritenfunktion zu registrieren
  - Die Rankingdaten der offiziellen Websites lassen sich automatisiert extrahieren
  - Ein redaktionelles P4P-Ranking wird von der Zielgruppe als sinnvolle Ergänzung wahrgenommen

- **Abgrenzung:**
  - Keine Live-Wettkampfergebnisse oder Ereigniskalender
  - Kein Vergleich anderer Kampfsportarten
  - Keine Nutzer-zu-Nutzer-Kommunikation oder soziales Netzwerk

---

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

- **Zielgruppenverständnis:**  
  Die primäre Zielgruppe sind Muay-Thai-Fans und sportlich Interessierte mit mittlerer bis hoher Web-Erfahrung, aber potenziell geringer Vertrautheit mit den Strukturen verschiedener Ranking-Organisationen. Hintergrundrecherche auf den offiziellen Websites von WBC Muay Thai (`wbcmuaythai.com`) und RWS (`rank.rajadamnern.com`) zeigte, dass jede Organisation eine eigene Struktur und eigene Gewichtsklassenbezeichnungen verwendet – ein direkter Vergleich ist dort nicht möglich.

  **Proto-Persona: «Der engagierte Fan»**

  | | |
  |---|---|
  | **Name** | Marc, 28 Jahre, Muay-Thai-Hobbyathlet und Fan |
  | **Motivation** | Verfolgt Profikämpfer auf sozialen Medien; möchte wissen, wie sein Lieblingskämpfer im internationalen Vergleich dasteht |
  | **Problem** | Muss mehrere Websites besuchen und Rankings manuell vergleichen; findet keinen zentralen Überblick |
  | **Erwartung** | Eine App, die auf einen Blick zeigt, wo ein Kämpfer organisationsübergreifend gelistet ist, und ihm erlaubt, Lieblingskämpfer zu speichern |
  | **Web-Erfahrung** | Mittel – nutzt täglich Social Media und Streaming, aber keine spezialisierten Sportdatenbanken |

- **Wesentliche Erkenntnisse:**
  - WBC Muay Thai und RWS organisieren Rankings je Organisation und Gewichtsklasse – nicht nach Kämpfername; der Einstieg muss zwingend über Organisation + Gewichtsklasse führen
  - Derselbe Kämpfer kann in mehreren Organisationen und Gewichtsklassen gelistet sein – Fighter-Profile müssen organisationsübergreifend konsolidiert werden
  - Für Muay-Thai-Neulinge ist der Begriff «Gewichtsklasse» im organisationsspezifischen Kontext nicht selbstverständlich (bestätigt durch Usability-Test)
  - Die Navigation zur Ranking-Liste ist der kritischste Einstiegspunkt – Unklarheit dort blockiert den gesamten Workflow

### 3.2 Sketch

- **Variantenüberblick:**  
  Im Sketch-Schritt wurden mehrere Varianten für die Hauptnavigation und die Rankings-Seite entwickelt:
  - **Variante A – Dropdown-Formular:** Ein kombiniertes Formular mit Organisations- und Gewichtsklassen-Dropdown auf einer Seite; einfach, aber wenig visuell differenziert
  - **Variante B – Tab-Navigation:** Organisationen als horizontale Tabs, Gewichtsklasse als Dropdown nach Tab-Auswahl; klare Trennung der beiden Auswahlschritte
  - **Variante C – Kachelansicht auf Startseite:** Organisationen als klickbare Kacheln direkt auf der Startseite sichtbar; niedrige Klicktiefe, aber Startseite muss mehrere Nutzungsrollen (Gast / User / Admin) bedienen

- **Skizzen:**  
  Die ausgearbeiteten Mockups (mehrere Screens inkl. Home, Rankings-Workflow, Fighter-Detailseite und Login/Register) sind dokumentiert in:  
  → [docs/mockups/Aufgabe10_Mockups.pdf](docs/mockups/Aufgabe10_Mockups.pdf)

### 3.3 Decide

- **Gewählte Variante & Begründung:**  
  Umgesetzt wurde **Variante B (Tab-Navigation)** für die Rankings-Seite, kombiniert mit einer rollenabhängigen Startseite.

  Entscheidungskriterien:
  - Tabs für Organisationen sind im Web ein etabliertes Muster und für Nutzer sofort erkennbar
  - Der zweistufige Prozess (Organisation via Tab → Gewichtsklasse via Dropdown) ist klarer als ein kombiniertes Dropdown-Formular
  - Variante C (Kacheln auf Startseite) wurde verworfen: Die Startseite dient als Landingpage für drei verschiedene Nutzerrollen (Gast, eingeloggter User, Admin) und kann deshalb nicht primär als Ranking-Einstieg gestaltet werden
  - Variante A (Dropdown-Formular) war die ursprüngliche Implementierung – sie wurde nach dem Usability-Test durch Variante B ersetzt, weil beide Testpersonen Schwierigkeiten mit der Navigation hatten (Usability-Befund, Schweregrad 3)

- **End-to-End-Ablauf:**  
  Gast öffnet App → sieht Startseite mit Feature-Übersicht → navigiert zu «Rankings» → wählt Organisation via Tab (P4P / WBC / RWS) → wählt Gewichtsklasse via Dropdown → sieht Ranking-Liste → klickt Fighter-Name → öffnet Fighter-Detailseite → Favoriten-Button ist sichtbar, aber für Gäste deaktiviert → Nutzer registriert sich oder loggt sich ein → speichert Favoriten → öffnet Favoritenliste

- **Informationsarchitektur & geplante Routen:**  
  → [docs/architecture/routes-plan.md](docs/architecture/routes-plan.md)

### 3.4 Prototype

#### 3.4.1 Entwurf (Design)

> **Hinweis:** Beschrieben wird der Prototyp (implementierte App), nicht das Mockup.

- **Informationsarchitektur:**  
  Die Navigation ist rollenabhängig und zeigt nur kontextrelevante Links:

  | Rolle | Sichtbare Navigation |
  |---|---|
  | Gast | Rankings, Login, Register |
  | Eingeloggter User | Rankings, Fighters, Favourites, Logout |
  | Admin | Rankings, Fighters, Admin-Panel, Logout |

  Alle Unterseiten sind über einen globalen Zurück-Button (oben links im Layout) erreichbar. Die Startseite zeigt je nach Rolle eine andere Ansicht: Gäste sehen eine Landingpage mit Feature-Übersicht, eingeloggte User einen personalisierten Home-Screen mit Favoriten-Schnellzugriff und Bild-Carousel, Admins ein Dashboard mit Datenbankstatistiken.

  Detaillierte Routenplanung → [docs/architecture/routes-plan.md](docs/architecture/routes-plan.md)

- **User Interface Design:**  
  Das UI verwendet ein durchgängig dunkles Theme mit goldenem Akzent (#d6a33d) – angelehnt an die Ästhetik professioneller Kampfsport-Medien. Wichtige Screens der Prototyp-Version:

  | Screen | Screenshot |
  |---|---|
  | Login | [Version1_login.png](docs/screenshots/Version%201/Version1_login.png) |
  | Registrierung | [Version1_Register.png](docs/screenshots/Version%201/Version1_Register.png) |
  | Ranking-Liste finden | [Version1_Ranking_Finden.png](docs/screenshots/Version%201/Version1_Ranking_Finden.png) |
  | Fighter-Informationen | [Version1_Fighter_Informationen_Finden.png](docs/screenshots/Version%201/Version1_Fighter_Informationen_Finden.png) |
  | Favorit speichern | [Version1_Favorit_speichern.png](docs/screenshots/Version%201/Version1_Favorit_speichern.png) |
  | Favoritenliste öffnen | [Version1_Favoritenliste_oeffnen.png](docs/screenshots/Version%201/Version1_Favoritenliste_oeffnen.png) |

- **Designentscheidungen:**
  - **Dunkles Theme:** Entspricht der Ästhetik von Kampfsport-Medien (UFC, ONE Championship, etc.) und reduziert Blendung bei Abendnutzung
  - **Goldener Akzent (#d6a33d):** Schafft klare visuelle Hierarchie; hebt aktive Tabs, primäre Buttons und Ranking-Positionen hervor
  - **Tabs statt Dropdowns für Organisationen:** Direkte Konsequenz aus dem Usability-Test – Dropdown-Navigation für die Organisations-Auswahl war zu wenig sichtbar; Tabs sind sofort als Auswahlmöglichkeit erkennbar
  - **Kartendesign für Favoriten:** Favoriten sind eine persönliche Sammlung ohne feste Reihenfolge – Karten eignen sich besser als eine nummerierte Ranking-Liste
  - **Rollenabhängige Startseite:** Ermöglicht massgeschneiderte Erfahrungen für Gäste (Conversion-orientiert), User (Schnellzugriff auf Favoriten) und Admins (Systemübersicht)

#### 3.4.2 Umsetzung (Technik)

- **Technologie-Stack:**
  - **Frontend:** SvelteKit 2, Svelte 5 (Runes API), reines CSS ohne CSS-Framework
  - **Backend:** SvelteKit Server-Routen und Form Actions (Node.js)
  - **Datenbank:** MongoDB 7 (Atlas), direkter `mongodb`-Driver ohne Mongoose
  - **Deployment:** Netlify mit `@sveltejs/adapter-auto`
  - **Scraper:** Python 3 mit Playwright (separates Script, nicht Teil des SvelteKit-Prozesses)

- **Tooling:**
  - IDE: Visual Studio Code mit Svelte- und ESLint-Extensions
  - Datenbankmanagement lokal: MongoDB Compass
  - KI-Assistent: Claude Code (Anthropic) – Details in [Kapitel 6](#6-ki-deklaration)

- **Struktur & Komponenten:**

  ```
  src/
  ├── lib/
  │   ├── components/     Wiederverwendbare UI-Komponenten
  │   │                   (Navbar, Footer, FighterBrowser, CountrySelect,
  │   │                    RankingList, FavoriteButton, FighterDetail, …)
  │   └── server/         Serverseitige Module
  │                       (db.js, auth.js, favorites.js, xmlParser.js,
  │                        rankingsXml.js, p4p.js, announcements.js)
  └── routes/
      ├── /               Startseite (3 Ansichten: Gast / User / Admin)
      ├── /rankings        Ranking-Browser mit Org-Tabs und Gewichtsklassen-Dropdown
      ├── /fighters        Fighter-Verzeichnis mit Suche und Filter
      ├── /fighters/[id]   Fighter-Detailseite mit Profil und Ranking-Einträgen
      ├── /favorites        Persönliche Favoritenliste (nur eingeloggte User)
      ├── /login           Login-Seite
      ├── /register        Registrierungs-Seite
      ├── /account         Accountverwaltung
      ├── /admin           Admin-Panel (zugriffgeschützt)
      └── /api/admin/scrape  API-Endpunkt für manuellen Scraper-Trigger
  ```

- **Daten & Schnittstellen:**  
  Die Datenpipeline verläuft in zwei Stufen:

  1. **Scraper → MongoDB:** Ein Python/Playwright-Scraper extrahiert Ranking-Daten von den offiziellen WBC- und RWS-Websites und schreibt sie per Upsert direkt in MongoDB-Collections (`fighters`, `rankings`, `organisations`).
  2. **MongoDB → Frontend:** SvelteKit-Load-Funktionen lesen die Daten über den MongoDB-Driver und liefern sie als typisierte Props an Svelte-Komponenten.

  MongoDB-Collections im Überblick:

  | Collection | Inhalt |
  |---|---|
  | `users` | Benutzerkonten mit gehashten Passwörtern |
  | `favorites` | User-Fighter-Zuordnungen |
  | `fighters` | Fighter-Stammdaten (Name, Nationalitäten, Alter, Rekord) |
  | `organisations` | Organisations-Stammdaten inkl. Gewichtsklassen |
  | `rankings` | Ranking-Einträge (Position, Fighter-ID, Org-ID, Gewichtsklassen-ID, Timestamp) |
  | `announcements` | Aktuelle Ankündigungen für den scrollenden Banner |
  | `pound_for_pound` | Redaktionelles P4P World Ranking (bis 10 Einträge) |

  Die ursprüngliche XML-Datenstruktur (verwendet in der ersten Prototyp-Phase vor der MongoDB-Migration) ist dokumentiert in:  
  → [docs/architecture/xml-structure.md](docs/architecture/xml-structure.md)

- **Deployment:**  
  Live-Version (Abgabe):  
  **https://muaythairankings.netlify.app**

  GitHub Repository:  
  **https://github.com/SanyZHAW/mt-rankings**

- **Lokale Entwicklung:**

  Voraussetzungen: Node.js ≥ 18, MongoDB Atlas-Verbindungsstring (oder lokale MongoDB-Instanz)

  ```sh
  # 1. Abhängigkeiten installieren
  npm install

  # 2. Umgebungsvariablen konfigurieren
  # .env-Datei erstellen und ausfüllen:
  #   DB_URI=mongodb+srv://...
  #   DB_NAME=mt-rankings

  # 3. Entwicklungsserver starten
  npm run dev -- --open

  # 4. Produktions-Build erstellen
  npm run build
  ```

  Netlify muss mit denselben Variablennamen konfiguriert werden (`DB_URI`, `DB_NAME`).

- **Besondere Entscheidungen:**
  - **MongoDB statt XML als primäre Datenquelle:** Das initiale Konzept verwendete eine XML-Datei für Fighter- und Ranking-Daten (vgl. xml-structure.md). Für den finalen Prototyp wurde auf MongoDB migriert, da der Scraper Daten direkt in die Datenbank schreibt und dort effizienter abgefragt werden können.
  - **Kein Mongoose:** Direkte Nutzung des MongoDB-Drivers reduziert Overhead und vereinfacht Schema-Änderungen in der Prototyping-Phase.
  - **Svelte 5 Runes:** Neuere Reaktivitäts-API, die klarer zwischen reaktivem State (`$state`, `$derived`) und regulären Variablen unterscheidet; wird im Projekt durchgängig genutzt.

- **Aktueller Stand des Scrapers (Prototyp-Phase):**  
  Der Scraper ist funktionsfähig, aber noch nicht vollautomatisch. Folgende Einschränkungen sind bekannt:
  - **Alter und Kampfrekord nicht scrappbar:** Die WBC- und RWS-Websites stellen `age` und `record` nicht maschinenlesbar bereit. Beide Python-Skripte schreiben diese Felder deshalb bewusst leer (`age=""`, `record=""`). Die Werte in den aktuellen XML-Dateien sind manuell mit realistischen Beispieldaten ergänzt worden, damit der Prototyp vollständige Fighter-Profile zeigen kann.
  - **Nationalitäten:** WBC-Nationalitäten werden aus dem Format `«Name (Country)»` im Seitentext geparst; RWS-Nationalitäten werden aus ISO-Flag-Spans (`fi-XX`) ausgelesen. Mehrfachnationalitäten werden korrekt erkannt und als `<nationalities>`-Block in die XML-Datei geschrieben.
  - **Halbmanueller Workflow:** Der Sync-Prozess ist aktuell zweistufig:
    1. Python-Skript lokal ausführen (`python static/scripts/scrape_wbc.py` bzw. `scrape_rws.py`) → überschreibt die XML-Dateien in `static/data/`
    2. Als Admin in der App einloggen → im Admin-Panel den Sync-Button betätigen → API-Endpunkt liest die XML-Datei und schreibt die Daten in MongoDB
  - **Nächster Schritt in einer Produktivversion:** Vollautomatischer Scraper-Cronjob auf dem Server (z. B. als Netlify Scheduled Function oder separater Cron-Job), der beide Skripte regelmässig ausführt und den Sync-Schritt ebenfalls automatisch triggert – ohne manuellen Admin-Eingriff.

### 3.5 Validate

- **Getestete Version:**  
  Die beim Usability-Test verwendete Version ist nicht mehr aktiv. Der getestete Stand ist in [docs/screenshots/](docs/screenshots/) dokumentiert.  
  *(Ältere Prototyp-Version – getestet vor Admin-Panel, Scraper und MongoDB-Migration; bewusst so gewählt, um den Grundworkflow ohne spätere Erweiterungen zu testen)*

- **URL der finalen Abgabeversion:**  
  https://muaythairankings.netlify.app  
  *(Enthält alle Erweiterungen aus Kap. 4; nicht Gegenstand des Usability-Tests)*

- **Testaccounts (aktuelle Abgabeversion):**

  | Rolle | Benutzername / E-Mail | Passwort |
  |---|---|---|
  | Admin | admin@gmail.com | Admin123; |
  | Normaler User | Sany22 *(Login per Username)* | Testtt |

- **Ziele der Prüfung:**  
  Überprüft wurde, ob Testpersonen die drei wichtigsten Workflows (Ranking finden, Fighter-Informationen finden, Registrierung/Login + Favorit speichern + Favoritenliste öffnen) selbstständig und ohne Hilfe durchführen können. Zentrale Leitfrage: Ist der Einstieg in den Ranking-Workflow intuitiv?

- **Vorgehen:**  
  Moderierter Usability Test vor Ort auf einem Desktop-Browser; Think-Aloud-Methode (Testpersonen sprechen laut, was sie denken); Testleitung ohne Eingreifen; schriftliche Nachfragen am Schluss der Sitzung.  
  **Testleitung:** Saam Eymany

- **Stichprobe:**  
  2 Testpersonen (TP1: Liam Reihwald, TP2: Eric Bernet); beide mit geringer Muay-Thai-Erfahrung und mittlerer Web-Erfahrung; Sitzungsdauer je ca. 15–20 Minuten.

- **Aufgaben/Szenarien:**

  1. **Ranking finden:** Eine Ranking-Liste für eine Organisation und Gewichtsklasse eigener Wahl finden
  2. **Fighter-Informationen finden:** Die Detailseite eines Fighters aus der Ranking-Liste öffnen
  3. **Registrieren/Login → Favorit speichern → Favoritenliste öffnen:** Vollständigen Favoriten-Workflow als registrierter Nutzer durchführen

- **Kennzahlen & Beobachtungen:**

  | Aufgabe | Erfolgsquote | Ø Zeitbedarf | Hauptbeobachtung |
  |---|---|---|---|
  | Ranking finden | 100 % (mit Umwegen) | ca. 4,5 Min. | Navigation zu Organisation und Gewichtsklasse war für beide Testpersonen nicht intuitiv |
  | Fighter-Informationen finden | 100 % | ca. 1 Min. | Detailseite wurde schnell und problemlos geöffnet |
  | Registrieren, Favorit, Favoritenliste | 100 % (1× mit Unsicherheit) | ca. 6 Min. | TP2 wusste zunächst nicht, dass vor dem Speichern eines Favoriten ein Login nötig ist |

  Grösstes Problem: Navigation zur Ranking-Liste (Schweregrad 3 von 4 – «Aufgabe nur mit Mühe abschliessbar»). Die Organisations- und Gewichtsklassen-Auswahl war nicht sofort erkennbar.

- **Zusammenfassung der Resultate:**  
  Alle Aufgaben wurden von beiden Testpersonen abgeschlossen, jedoch mit unterschiedlichem Aufwand. Die Fighter-Detailseite und die Ranking-Liste selbst wurden positiv aufgenommen – die Struktur war klar und übersichtlich. Der kritischste Punkt ist der Einstieg in den Rankings-Workflow: Beide Testpersonen brauchten mehrere Minuten, um zur Ranking-Liste zu gelangen. Dieses Feedback deckte sich mit einer unabhängigen Rückmeldung eines Kollegen. Die Favoriten-Funktion war grundsätzlich verständlich, aber der Zusammenhang zwischen Favoriten und Login-Pflicht war nicht früh genug kommuniziert.

- **Abgeleitete Verbesserungen (priorisiert):**

  | # | Verbesserung | Priorität | Umgesetzt? |
  |---|---|---|---|
  | 1 | Navigation zur Rangliste intuitiver – Org-Tabs statt Dropdowns | hoch | **Ja** (Kap. 4.5 / Tab-Navigation) |
  | 2 | Hinweis beim Favoriten-Symbol: «Zum Speichern bitte einloggen» | mittel | Teilweise (Button deaktiviert für Gäste) |
  | 3 | Login-/Registrierungs-Status klarer sichtbar machen | mittel | Teilweise (Navbar-Anpassung) |
  | 4 | Tooltip oder Erklärung bei Gewichtsklassen-Begriffen | mittel | Ausstehend |
  | 5 | Favoriten-Link in Navigation nach Login klarer hervorheben | tief | **Ja** (Navbar nur für eingeloggte User) |
  | 6 | Fighter direkt per Name suchen, unabhängig vom Rankings-Workflow | mittel | **Ja** (Kap. 4.5 / Fighter Browser mit Suche und Filter) |
  | 7 | Navigation zwischen Seiten vereinfachen | tief | **Ja** (globaler Zurück-Button in Layout, alle Seiten ausser Home) |

- **Testplan & Auswertung:**  
  → [docs/usability/usability_testplan.md](docs/usability/usability_testplan.md)  
  → [docs/usability/usability_auswertung.md](docs/usability/usability_auswertung.md)

---

## 4. Erweiterungen

> Jede Erweiterung geht über den Mindestumfang (Rankings anzeigen, Favoriten speichern) hinaus.

### 4.1 Admin-Panel

- **Beschreibung & Nutzen:** Vollständiges Backend-Interface für Admins zur Datenverwaltung ohne direkten Datenbankzugriff. Umfasst User-Management (Rollen ändern, User löschen), Fighter-CRUD (Name, Nationalitäten, Alter, Rekord), Ankündigungs-Banner-Management und P4P-Ranking-Pflege – alles über ein tab-basiertes Interface direkt in der App.
- **Wo umgesetzt:**
  - **Frontend:** Tab-basiertes Interface in `src/routes/admin/+page.svelte` (Tabs: Users, Fighters, P4P Ranking, Announcement)
  - **Backend:** Form Actions in `src/routes/admin/+page.server.js` (`update`, `delete`, `updateFighter`, `deleteFighter`, `saveAnnouncement`, `saveP4P`)
  - **Datenbank:** Lese- und Schreibzugriff auf Collections `users`, `fighters`, `organisations`, `announcements`, `pound_for_pound`
- **Referenz:** Erreichbar nach Login als Admin unter `/admin`; Admin-Startseite unter `/`
- **Aus Evaluation abgeleitet?:** Nein – Verwaltungsanforderung aus dem Projektkontext

### 4.2 P4P World Ranking

- **Beschreibung & Nutzen:** Ein redaktionelles Pound-for-Pound-Ranking, das die besten Muay-Thai-Kämpfer organisationsübergreifend gegenüberstellt. Admins wählen bis zu 10 Kämpfer aus und können eine kurze Notiz pro Eintrag hinzufügen. Das Ranking ist öffentlich als erster Tab auf der Rankings-Seite sichtbar und zeigt Flaggen-Emojis, Nationalität und Organisations-Zugehörigkeit.
- **Wo umgesetzt:**
  - **Frontend:** Tab «P4P World» in `src/routes/rankings/+page.svelte`; Editor-Formular in `src/routes/admin/+page.svelte`
  - **Backend:** `src/lib/server/p4p.js` (`getP4P`, `upsertP4P`); Form Action `saveP4P` in `src/routes/admin/+page.server.js`
  - **Datenbank:** Collection `pound_for_pound` – ein Dokument `p4p-world` mit `entries`-Array, `updatedAt` und `updatedBy`
- **Referenz:** Öffentlich unter https://muaythairankings.netlify.app/rankings (Tab «P4P World»)
- **Aus Evaluation abgeleitet?:** Nein – eigenständige redaktionelle Erweiterung

### 4.3 Python-Scraper (Playwright)

- **Beschreibung & Nutzen:** Automatisierter Scraper zum Extrahieren aktueller Ranking-Daten von den offiziellen WBC-Muay-Thai- und RWS-Websites. Der Scraper schreibt die Daten per Upsert direkt in MongoDB. Ein API-Endpunkt im Admin-Panel ermöglicht den manuellen Scraper-Trigger. Der Sync-Status (letzter Scraper-Lauf) ist auf der Admin-Startseite sichtbar.
- **Wo umgesetzt:**
  - **Frontend:** Scraper-Trigger-Schnittstelle im Admin-Panel
  - **Backend:** API-Endpunkt `src/routes/api/admin/scrape/rws/+server.js`; Upsert-Logik für `fighters`, `organisations`, `rankings`-Collections
  - **Datenbank:** Upsert auf `fighters`, `organisations`, `rankings`; `updatedAt`-Timestamp pro Ranking-Eintrag
- **Referenz:** Sync-Status sichtbar auf der Admin-Startseite (Stat Cards «Last WBC Sync» / «Last RWS Sync» mit Farbindikator)
- **Aus Evaluation abgeleitet?:** Nein – technische Infrastruktur-Erweiterung für Datenaktualität

### 4.4 Ankündigungs-Banner

- **Beschreibung & Nutzen:** Ein scrollender Ticker-Banner auf der Startseite für eingeloggte User. Admins können den Bannertext jederzeit über das Admin-Panel aktualisieren. Der Banner erscheint automatisch, sobald ein aktiver Ankündigungstext in der Datenbank hinterlegt ist, und respektiert die Systemeinstellung «prefers-reduced-motion».
- **Wo umgesetzt:**
  - **Frontend:** CSS-Ticker-Animation in `src/routes/+page.svelte` (`.ann-banner`, `.ann-track`); Einstellungsformular in `src/routes/admin/+page.svelte`
  - **Backend:** `src/lib/server/announcements.js`; Form Action `saveAnnouncement` in `src/routes/admin/+page.server.js`
  - **Datenbank:** Collection `announcements`
- **Referenz:** Sichtbar auf der Startseite für eingeloggte User, oberhalb des Bild-Carousels
- **Aus Evaluation abgeleitet?:** Nein

### 4.5 Fighter Browser mit Suche und Filter

- **Beschreibung & Nutzen:** Eine dedizierte Seite (`/fighters`) mit allen Kämpfern, einer Textsuche nach Name sowie Filtern nach Organisation, Gewichtsklasse und Sortierung (Name / Ranking-Position). Ermöglicht das Entdecken von Kämpfern unabhängig vom Rankings-Workflow – besonders sinnvoll für Nutzer, die einen bestimmten Kämpfer direkt suchen.
- **Wo umgesetzt:**
  - **Frontend:** `src/routes/fighters/+page.svelte`; wiederverwendbare Komponente `src/lib/components/FighterBrowser.svelte` (auch im Admin-Panel für Fighter-CRUD genutzt)
  - **Backend:** `src/routes/fighters/+page.server.js` – lädt alle Fighter ohne Limit aus MongoDB
  - **Datenbank:** Vollständige Abfrage der `fighters`-Collection mit Sortierung nach Name
- **Referenz:** `/fighters` – in der Navigation für eingeloggte User sichtbar
- **Aus Evaluation abgeleitet?:** Teilweise – die Evaluation zeigte, dass Nutzer Fighter auch direkt suchen wollen, nicht nur über den Rankings-Workflow

### 4.6 Country Selector mit Flaggen-Emojis

- **Beschreibung & Nutzen:** Eine durchsuchbare Dropdown-Komponente zur Nationalitätsauswahl im Fighter-Bearbeitungsformular des Admin-Panels. Zeigt Länder mit Flaggen-Emojis, unterstützt Suche nach Name und ISO-Code, und speichert den ISO-3166-1-Code in der Datenbank. Die Komponente löst auch das Problem inkonsistenter Ländernamen (ältere Einträge als Volltext, neuere als ISO-Code) durch eine Dual-Lookup-Logik.
- **Wo umgesetzt:**
  - **Frontend:** `src/lib/components/CountrySelect.svelte` – eigenständige, wiederverwendbare Svelte-5-Komponente mit ARIA-Combobox-Pattern
  - **Backend:** Kein separater Endpunkt – Daten werden via bestehende Fighter-Update-Action (`updateFighter`) gespeichert
  - **Datenbank:** Speichert ISO-Code in `fighters.nationalities`-Array
- **Referenz:** Fighter-Bearbeitungsformular im Admin-Panel (Tab «Fighters», «Edit»-Button bei jedem Fighter)
- **Aus Evaluation abgeleitet?:** Nein – technische Qualitätsverbesserung der Datenkonsistenz

### 4.7 Admin Dashboard mit Visualisierungen

- **Beschreibung & Nutzen:** Die Admin-Startseite bietet einen sofortigen Überblick über den Datenbankzustand: 5 Stat-Cards (Anzahl Fighter, Ranking-Listen, Users, letzter WBC-Sync, letzter RWS-Sync) sowie ein interaktives Donut-Diagramm mit Fighter-Verteilung nach Organisation (WBC / RWS / Other). Der Sync-Status wird mit einem Farbindikator visualisiert (grün = aktuell, gelb = veraltet, rot = sehr alt / nie synchronisiert).
- **Wo umgesetzt:**
  - **Frontend:** Stat Cards, Donut-Chart und Sync-Indikatoren als SVG in `src/routes/+page.svelte` (Admin-View)
  - **Backend:** `src/routes/+page.server.js` – aggregierte Datenbankabfragen (`countDocuments`, `findOne` mit Sort auf `updatedAt`)
  - **Datenbank:** Queries auf `fighters`, `rankings`, `users` (Counts); `rankings`-Collection für Sync-Timestamps nach Organisations-ID
- **Referenz:** Admin-Startseite – direkt nach Login als Admin sichtbar; Link zum Admin-Panel unterhalb der Visualisierungen
- **Aus Evaluation abgeleitet?:** Nein – Betriebstransparenz für Admin-Nutzer

---

## 5. Projektorganisation

- **Repository & Struktur:**  
  https://github.com/SanyZHAW/mt-rankings  
  Einzelprojekt (kein Team). Die Ordnerstruktur folgt den SvelteKit-Konventionen:

  ```
  mt-rankings/
  ├── src/          SvelteKit-App (routes, lib)
  ├── static/       Statische Assets (Bilder, robots.txt)
  ├── docs/         Projektdokumentation (architecture, usability, mockups, screenshots, vorgaben)
  └── package.json
  ```

- **Commit-Praxis:**  
  Conventional Commits – jeder Commit beschreibt eine abgeschlossene, thematisch abgegrenzte Änderung:
  - `feat:` – neue Funktion oder Feature
  - `fix:` – Fehlerbehebung
  - `refactor:` – Umstrukturierung ohne funktionale Änderung
  - `chore:` – Maintenance, Cleanup, Dokumentation

  Beispiele aus der Git-History:  
  `feat(rankings): add MT World P4P ranking tab and admin editor`  
  `fix(login): redirect to home page after login instead of rankings`  
  `chore: remove unused files, redundant comments and fix warnings`

- **Issue-Management:**  
  Änderungen wurden direkt im Git-Workflow verwaltet. Kein separates Issue-Tracking-Tool eingesetzt.

---

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:**
  - **Claude Code** (Anthropic) – primäres Tool, direkt in VS Code über die Claude Code Extension integriert. Modell: Claude Sonnet 4.x
  - **Claude.ai** (Web-Interface) – gelegentlich für erste Konzeptdiskussionen und Textreviews

- **Zweck & Umfang:**  
  KI wurde intensiv in allen Entwicklungsphasen eingesetzt. Grosse Teile des Quellcodes entstanden unter direkter KI-Unterstützung oder wurden auf Basis von KI-Vorschlägen weiterentwickelt:
  - Komponentenentwicklung (Svelte 5 Runes, Reactivity-Patterns, ARIA-Konformität)
  - Serverseitige Logik (SvelteKit Form Actions, MongoDB-Queries, Auth-Logik)
  - Scraper-Entwicklung (Python / Playwright)
  - Debugging und Fehleranalyse (Svelte-Warnings, MongoDB-Query-Fehler, ARIA-Fehler)
  - Refactoring und Code-Cleanup (Dead Code entfernen, Konventionen vereinheitlichen)
  - Feature-Konzeption (P4P-Ranking-Datenbankstruktur, Admin-Panel-Design)
  - Projektdokumentation (README-Struktur, Kapitel-Entwürfe)

- **Eigene Leistung (Abgrenzung):**
  - Alle Anforderungen und Features wurden eigenständig konzipiert, priorisiert und entschieden
  - Jede Codeänderung wurde vor dem Commit manuell geprüft, verstanden und ggf. angepasst
  - Usability-Tests wurden eigenständig geplant, moderiert und ausgewertet – ohne KI-Beteiligung
  - Datenbankstruktur und Architekturentscheidungen (MongoDB statt Mongoose, XML-zu-MongoDB-Migration) wurden eigenständig getroffen
  - Die Entscheidung, welche Features als Erweiterungen umgesetzt werden, war eine eigene konzeptuelle Entscheidung

### 6.2 Prompt-Vorgehen

Die Arbeit mit Claude Code verlief konsequent iterativ und schrittweise:

1. **Analyse vor Implementierung:** Vor jeder Änderung wurde Claude gebeten, zuerst den bestehenden Code zu lesen und eine Strategie vorzuschlagen. Erst nach Abstimmung wurde implementiert. Wenn unklar war, ob eine Lösung passt, wurden zuerst Optionen diskutiert.

2. **Schrittweise Dekomposition:** Komplexere Features (z. B. P4P-Ranking, Admin-Panel, Country Selector) wurden in Teilaufgaben aufgeteilt – zuerst Datenbankstruktur und Server-Logik, dann Frontend, dann Edge Cases und Accessibility.

3. **Explizite Abgrenzungen in Prompts:** Jeder Prompt enthielt klare Grenzen: «nur diese Datei», «keine Logik-Änderungen», «erst analysieren, dann ändern». Das verhinderte unbeabsichtigte Seiteneffekte.

4. **Debugging-Prompts mit Kontext:** Bei Fehlern wurden Fehlermeldungen, relevanter Code und das erwartete Verhalten vollständig mitgegeben – keine Änderungen ohne Verständnis der Ursache.

5. **Qualitätssicherung als eigener Schritt:** Svelte-Warnings, ARIA-Fehler und Code-Stil wurden explizit als separate Aufgaben adressiert, nicht als Randnotiz.

### 6.3 Reflexion

**Nutzen:**  
Claude Code hat die Entwicklungsgeschwindigkeit erheblich erhöht – insbesondere bei SvelteKit- und Svelte-5-Runes-spezifischen Patterns, die noch wenig in der öffentlichen Dokumentation abgedeckt sind. Debugging von MongoDB-Queries, ARIA-Konformität und responsivem CSS wäre ohne KI-Unterstützung deutlich zeitaufwändiger gewesen. Die iterative Vorgehensweise («Analyse → Vorschlag → Bestätigung → Implementierung») hat sich bewährt.

**Grenzen:**  
KI generiert Code, der syntaktisch korrekt, aber nicht immer im projektspezifischen Kontext passend ist. Konkret: In einigen Fällen wurden Svelte-5-Patterns vorgeschlagen (`$derived.by` statt `$derived(() => ...)`, `$effect` statt reaktiver Template-Logik), die in der Runes-API des Projekts nicht korrekt funktionierten. Hier war manuelles Debugging nötig. KI kennt den Gesamtkontext des Projekts erst nach explizitem Einlesen der relevanten Dateien – das muss bei jedem Prompt eingeplant werden.

**Risiken & Qualitätssicherung:**  
Alle KI-generierten Codeänderungen wurden vor dem Commit mit `vite build` (auf Build-Fehler und Svelte-Warnings geprüft) und manuellen Tests im Browser verifiziert. Datenbankoperationen (insbesondere Lösch- und Update-Aktionen) wurden besonders sorgfältig geprüft. Die Usability-Evaluation wurde bewusst vollständig unabhängig von KI durchgeführt, um unvoreingenommene Nutzerfeedbacks zu erhalten und keine KI-Bias in die Testergebnisse einzubringen.

---

## 7. Anhang

### Dokumentation

| Datei | Inhalt |
|---|---|
| [docs/architecture/xml-structure.md](docs/architecture/xml-structure.md) | XML-Datenmodell – ursprüngliche Prototyp-Datenstruktur (vor MongoDB-Migration) |
| [docs/architecture/routes-plan.md](docs/architecture/routes-plan.md) | Informationsarchitektur, geplante Routen und Navigationslogik |
| [docs/mockups/Aufgabe10_Mockups.pdf](docs/mockups/Aufgabe10_Mockups.pdf) | Ausgearbeitete Mockups (Aufgabe 10) |
| [docs/usability/usability_testplan.md](docs/usability/usability_testplan.md) | Usability-Testplan: Aufgaben, Vorgehen, geplante Kennzahlen |
| [docs/usability/usability_auswertung.md](docs/usability/usability_auswertung.md) | Usability-Auswertung: Ergebnisse, Issue Map, Verbesserungsableitung |
| [docs/screenshots/](docs/screenshots/) | Screenshots der Prototyp-Version (Version 1) |

### Video-Walkthrough

Video im Anhang

### Bildquellen

Die Carousel-Bilder auf der User-Startseite (`static/images/carousel/`) wurden für Demonstrationszwecken im Rahmen dieses Prototyps verwendet:

| Datei | Verwendung |
|---|---|
| `carousel_banner_01.jpg` | Slideshow-Bild, User-Startseite |
| `carousel_banner_02.jpg` | Slideshow-Bild, User-Startseite |
| `carousel_banner_03.jpg` | Slideshow-Bild, User-Startseite |
| `carousel_banner_04.jpg` | Slideshow-Bild, User-Startseite |

Für eine produktive Veröffentlichung sind lizenzrechtlich geklärte Bilder einzusetzen.

### Urheberrecht / Datenquellen

Die Ranking- und Fighter-Daten werden automatisiert von folgenden öffentlich zugänglichen Websites extrahiert:

- **WBC Muay Thai:** https://www.wbcmuaythai.com/male – Rankings öffentlich einsehbar
- **Rajadamnern World Series (RWS):** https://rank.rajadamnern.com/rankings – Rankings öffentlich einsehbar

Das Scraping erfolgt ausschliesslich für akademische Zwecke im Rahmen des ZHAW-Moduls Prototyping. Für eine produktive Veröffentlichung wäre eine Klärung der Nutzungsrechte mit den jeweiligen Organisationen erforderlich.
