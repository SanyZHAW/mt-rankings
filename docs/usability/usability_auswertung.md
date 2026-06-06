# Usability Evaluation – Auswertung

**Projekt:** MT Rankings  
**Getestete Version:** Nicht mehr aktiv; getesteter Stand dokumentiert in [docs/screenshots/](../screenshots/) — Stand vor Admin-Panel, Scraper und MongoDB-Migration  
**Datum:** Juni 2026  
**Anzahl Testpersonen:** 2  
**Testleitung:** Saam Eymany

---

## 1. Kurzbeschreibung der Durchführung

Der Test wurde moderiert und vor Ort durchgeführt. Beide Testpersonen nutzten einen Desktop-Browser. Die Sitzungen dauerten jeweils ca. 15–20 Minuten inklusive kurzer Nachfragen am Schluss. Die Testpersonen wurden gebeten, laut zu denken. Die Testleitung griff nicht ein und notierte Beobachtungen schriftlich.

Getestet wurde folgende Version des Prototyps:

Die ursprüngliche Test-URL ist nicht mehr aktiv. Der getestete Stand ist in [docs/screenshots/](../screenshots/) dokumentiert.

---

## 2. Ergebnisse pro Testperson

| Aufgabe | TP1 Liam Reihwald | TP2 Eric Bernet | Notizen |
|---|---|---|---|
| Aufgabe 1: Ranking finden | teilweise | teilweise | Beide Testpersonen fanden die Ranking-Liste, brauchten aber mehrere Schritte. Die Navigation zu Organisation und Gewichtsklasse war nicht sofort klar. |
| Aufgabe 2: Fighter-Informationen finden | erfolgreich | erfolgreich | Beide öffneten die Fighter-Detailseite ohne Probleme, nachdem sie die Liste gefunden hatten. |
| Aufgabe 3: Registrieren/Login, Favorit speichern und Favoriten-Liste öffnen | erfolgreich | erfolgreich | Beide Testpersonen konnten den Ablauf mit Login/Registrierung, Favorit speichern und Favoriten-Liste selbstständig abschliessen. Eric zögerte kurz, verstand den Zusammenhang zwischen Login/Registrierung und Favoriten danach aber ohne Hilfe. |

**Legende:** erfolgreich = ohne Hilfe abgeschlossen · teilweise = mit Zögern oder Umweg · nicht erfolgreich = abgebrochen oder auf Hilfe angewiesen

---

## 3. Kennzahlen

### 3.1 Erfolgsquote pro Aufgabe

| Aufgabe | Erfolgreich | Teilweise erfolgreich | Nicht erfolgreich | Erfolgsquote |
|---|---:|---:|---:|---:|
| Aufgabe 1: Ranking finden | 0/2 | 2/2 | 0/2 | 100 % abgeschlossen, aber mit Umwegen |
| Aufgabe 2: Fighter-Informationen finden | 2/2 | 0/2 | 0/2 | 100 % |
| Aufgabe 3: Registrieren/Login, Favorit speichern und Favoriten-Liste öffnen | 2/2 | 0/2 | 0/2 | 100 % |

### 3.2 Zeitbedarf pro Aufgabe

Die Zeiten sind ungefähre Beobachtungswerte aus dem moderierten Test.

| Aufgabe | TP1 Liam Reihwald | TP2 Eric Bernet | Interpretation |
|---|---:|---:|---|
| Aufgabe 1: Ranking finden | ca. 4 Minuten | ca. 5 Minuten | Beide brauchten länger als erwartet, weil der Einstieg zur Ranking-Liste nicht sofort klar war. |
| Aufgabe 2: Fighter-Informationen finden | ca. 1 Minute | ca. 1 Minute | Die Detailseite wurde schnell gefunden, sobald die Ranking-Liste erreicht war. |
| Aufgabe 3: Registrieren/Login, Favorit speichern und Favoriten-Liste öffnen | ca. 5 Minuten | ca. 6 Minuten | Beide konnten den Ablauf erfolgreich abschliessen. Der Ablauf dauerte etwas länger, weil zuerst Registrierung/Login durchgeführt und der Zusammenhang mit der Favoriten-Funktion verstanden werden musste. |

### 3.3 Wichtigste beobachtete Probleme

| Problem | Häufigkeit | Auswirkung |
|---|---:|---|
| Navigation zu Organisation und Gewichtsklasse nicht sofort klar | 2/2 | verlangsamte Aufgabe 1 deutlich |
| Begriff „Gewichtsklasse" für Muay-Thai-Neulinge nicht eindeutig | 2/2 | führte zu kurzem Zögern bei der Auswahl |
| Login-/Registrierungspflicht für Favoriten könnte früher kommuniziert werden | 1/2 | führte zu kurzem Zögern, die Aufgabe wurde aber erfolgreich abgeschlossen |
| Fighter-Detailseite unklar | 0/2 | kein Problem beobachtet |

---

## 4. Feedback Grid

| ✅ Was hat gut funktioniert? | ❌ Was hat nicht gut funktioniert? |
|---|---|
| Fighter-Detailseite war klar und übersichtlich | Navigation zu Organisation und Gewichtsklasse war nicht intuitiv genug |
| Ranking-Liste war verständlich aufgebaut | Einstieg in die App wirkte für Neu-Nutzer unklar |
| Favoriten-Symbol wurde erkannt und nach Login/Registrierung richtig genutzt | Zusammenhang zwischen Favoriten, Registrierung und Login könnte noch früher sichtbar sein |
| Nach erfolgreichem Login war das Speichern eines Favoriten verständlich | Der Grund für die Login-/Registrierungspflicht wurde vor dem Klick auf das Favoriten-Symbol noch nicht deutlich genug kommuniziert |

| ❓ Was hat gefehlt? | 💡 Neue Ideen / Anforderungen |
|---|---|
| Klarere Navigationspfade zur Rangliste | Direkter Einstieg mit sichtbarer Auswahl auf der Startseite |
| Hinweis beim Favoriten-Symbol, dass Login oder Registrierung nötig ist | Kurze Onboarding-Erklärung für neue Benutzer |
| Klarer Hinweis, ob man bereits eingeloggt ist oder sich zuerst registrieren muss | Login-/Registrierungs-Hinweis direkt beim Favoriten-Symbol oder auf der Favoriten-Seite anzeigen |

---

## 5. Issue Map

| Arbeitsschritt | Beobachtetes Problem | Betroffene Testperson(en) | Schweregrad (0–4) | Priorität | Mögliche Verbesserung |
|---|---|---|---:|---|---|
| Ranking finden | Navigation zu Organisation und Gewichtsklasse nicht intuitiv, mehrere Schritte nötig | TP1, TP2 | 3 | hoch | Auswahl von Organisation und Gewichtsklasse direkt auf der Startseite oder prominent in der Navigation sichtbar machen |
| Ranking finden | Begriff „Gewichtsklasse" war für Muay-Thai-Neulinge unbekannt | TP1, TP2 | 2 | mittel | Kurze Erklärung oder Tooltip bei Gewichtsklassen hinzufügen |
| Fighter öffnen | Kein Problem beobachtet | – | 0 | – | – |
| Registrieren/Login | TP2 zögerte kurz, verstand danach aber ohne Hilfe, dass vor dem Speichern eines Favoriten ein Login oder eine Registrierung nötig ist | TP2 | 1 | tief | Hinweis anzeigen: „Zum Speichern von Favoriten bitte einloggen oder registrieren" |
| Favorit speichern | Login-/Registrierungspflicht könnte im Favoriten-Ablauf früher kommuniziert werden | TP2 | 1 | tief | Login-Hinweis früher zeigen, z. B. direkt beim Favoriten-Symbol oder auf der Favoriten-Seite |
| Favoriten-Liste öffnen | Kein schweres Problem beobachtet, aber der Einstieg könnte sichtbarer sein | TP2 | 1 | tief | Favoriten-Link in der Navigation klarer hervorheben, sobald die Person eingeloggt ist |

**Schweregrad:**

| Wert | Bedeutung |
|---|---|
| 0 | Kein Problem |
| 1 | Kosmetisches Problem – stört nicht, fällt kaum auf |
| 2 | Kleines Problem – verlangsamt, aber lösbar |
| 3 | Grosses Problem – Aufgabe nur mit Mühe abschliessbar |
| 4 | Usability-Katastrophe – Aufgabe nicht abschliessbar |

---

## 6. Zusammenfassung der Resultate

Alle Aufgaben wurden erfolgreich oder teilweise erfolgreich abgeschlossen. Das grösste Problem war die Navigation zur Ranking-Liste: Beide Testpersonen fanden den Weg, brauchten jedoch mehrere Schritte und wirkten zeitweise unsicher. Dieses Feedback deckt sich mit einer Rückmeldung eines Kollegen, der ebenfalls eine intuitivere Navigation zur Rangliste vorgeschlagen hat. Die Fighter-Detailseite und die Ranking-Liste selbst wurden positiv aufgenommen. Die Favoriten-Funktion wurde von beiden Testpersonen erfolgreich genutzt. Trotzdem zeigte sich, dass der Zusammenhang zwischen Favoriten, Login und Registrierung noch früher und klarer kommuniziert werden könnte.

---

## 7. Abgeleitete Verbesserungen

| # | Verbesserung | Priorität | Begründung |
|---|---|---|---|
| 1 | Navigation zur Rangliste intuitiver gestalten – Auswahl von Organisation und Gewichtsklasse direkt auf der Startseite oder als prominentes Element in der Hauptnavigation | hoch | Beide Testpersonen und ein Kollege haben dieses Problem unabhängig voneinander gemeldet. Schweregrad 3. |
| 2 | Tooltip oder Hinweistext beim Favoriten-Symbol einbauen: „Zum Speichern von Favoriten bitte einloggen oder registrieren" | mittel | Der Favoriten-Ablauf wurde zwar erfolgreich abgeschlossen, der Zusammenhang zwischen Favoriten und Login/Registrierung könnte aber früher sichtbar sein. |
| 3 | Login-/Registrierungsstatus klarer anzeigen, z. B. „Eingeloggt" / „Nicht eingeloggt" oder sichtbarer Login-Button | mittel | Der Favoriten-Ablauf hängt vom Login ab. Deshalb sollte der Status für neue Benutzer klar sichtbar sein. |
| 4 | Kurze Erklärung oder Tooltip bei Gewichtsklassen-Begriffen hinzufügen | mittel | Beide Testpersonen hatten wenig Muay-Thai-Erfahrung und kannten den Begriff „Gewichtsklasse" nicht im Kontext des Sports. |
| 5 | Favoriten-Link nach dem Login sichtbarer machen | tief | Die Favoriten-Liste wurde gefunden, könnte aber in der Navigation klarer hervorgehoben werden. |
