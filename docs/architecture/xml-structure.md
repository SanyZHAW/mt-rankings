# MT Rankings – XML-Datenstruktur und MongoDB-Schema

## Überblick

MT Rankings verwendet XML-Dateien als Quelldatenformat für Fighter- und Ranking-Daten. Die Daten werden per Sync-Prozess in MongoDB übertragen, wo sie für die Webanwendung effizient abgefragt werden können.

**Zwei separate XML-Dateien:**
- `static/data/wbc_rankings.xml` – WBC Muay Thai (IDs mit Präfix `fighter-`)
- `static/data/rws_rankings.xml` – Rajadamnern World Series (IDs mit Präfix `rws-`)

Beide Dateien haben identische XML-Struktur. Der Sync-Prozess erkennt automatisch, welche Organisation die Daten liefert, und führt Fighter die in beiden Organisationen auftreten zu einem einzigen MongoDB-Dokument zusammen (Dedup-Logik, siehe unten).

---

## XML-Datenmodell

Das Wurzelelement ist `<mtRankings>`.

Die drei Hauptabschnitte:

- `<organisations>` – Ranking-Organisationen mit ihren Gewichtsklassen
- `<fighters>` – Fighter-Stammdaten
- `<rankings>` – Ranking-Listen, gruppiert nach Organisation und Gewichtsklasse

---

## Pflichtfelder und Struktur

### Organisation (`<organisation>`)

| Attribut / Element | Typ | Pflicht | Beschreibung |
|---|---|:---:|---|
| `id` (Attribut) | String | ✅ | Eindeutige Organisations-ID, z. B. `org-wbc`, `org-rws` |
| `<name>` | String | ✅ | Anzeigename, z. B. `WBC Muay Thai`, `Rajadamnern World Series` |
| `<website>` | URL | — | Offizielle Website der Organisation |
| `<weightClasses>` | Element | ✅ | Container für alle Gewichtsklassen dieser Organisation |

### Gewichtsklasse (`<weightClass>`)

| Attribut / Element | Typ | Pflicht | Beschreibung |
|---|---|:---:|---|
| `id` (Attribut) | String | ✅ | Eindeutige Gewichtsklassen-ID, z. B. `wbc-middleweight`, `rws-flyweight` |
| `<name>` | String | ✅ | Anzeigename, z. B. `Middleweight`, `Super Welterweight` |
| `<limit unit="lb">` | Zahl | — | Gewichtslimit in Pound; WBC verwendet Doppellimits (lb + kg) |
| `<limit unit="kg">` | Zahl | — | Gewichtslimit in Kilogramm |

**Hinweis:** RWS-Gewichtsklassen haben keine `<limit>`-Elemente. WBC-Gewichtsklassen haben je zwei `<limit>`-Elemente (lb und kg). Beide Formate werden vom Parser unterstützt.

### Fighter (`<fighter>`)

| Attribut / Element | Typ | Pflicht | Beschreibung |
|---|---|:---:|---|
| `id` (Attribut) | String | ✅ | Eindeutige Fighter-ID; WBC: `fighter-name`, RWS: `rws-name` |
| `<name>` | String | ✅ | Anzeigename des Kämpfers |
| `<country>` | String | — | Nationalität als Klartextname (legacy), z. B. `Thailand`, `Russia` |
| `<nationalities>` | Element | — | Neueres Format: Container für mehrere `<nationality>`-Tags |
| `<nationality>` | String | — | Innerhalb von `<nationalities>`: ISO-3166-1-Code, z. B. `TH`, `FR` |
| `<age>` | Zahl | — | Alter des Kämpfers; leer wenn unbekannt |
| `<record>` | String | — | Kampfrekord im Format `W-L-D`, z. B. `48-4-0` |

**Nationalitäten – zwei unterstützte Formate:**

**Format 1 (aktuell in XML-Dateien):** Einfaches `<country>`-Feld mit Klartextname:
```xml
<fighter id="rws-petchmorakot-bangmadklongtan">
  <name>Petchmorakot Bangmadklongtan</name>
  <country>Thailand</country>
  <age>23</age>
  <record>48-4-0</record>
</fighter>
```

**Format 2 (Parser-unterstützt, für manuelle Bearbeitung):** Mehrere Nationalitäten via `<nationalities>`:
```xml
<fighter id="fighter-example">
  <name>Example Fighter</name>
  <nationalities>
    <nationality>TH</nationality>
    <nationality>FR</nationality>
  </nationalities>
  <age>28</age>
  <record>30-5-1</record>
</fighter>
```

**Fallback-Logik im Parser (`src/lib/server/xmlParser.js`):**
- `<nationalities>` vorhanden und nicht leer → `nationalities`-Array aus `<nationality>`-Tags
- `<nationalities>` vorhanden aber leer → Fallback auf `<country>` als `[country]`
- Nur `<country>` vorhanden → `nationalities: [country]`
- Beides fehlt → `nationalities: []`

### Ranking-Eintrag

**Ranking-Liste (`<ranking>`):**

| Attribut | Typ | Pflicht | Beschreibung |
|---|---|:---:|---|
| `organisationId` | String | ✅ | Referenz auf `<organisation id>` |
| `weightClassId` | String | ✅ | Referenz auf `<weightClass id>` |
| `updatedAt` | Datum | — | Datum der letzten Aktualisierung, z. B. `2025-12-01` |

**Einzel-Eintrag (`<entry />`):**

| Attribut | Typ | Pflicht | Beschreibung |
|---|---|:---:|---|
| `position` | String | ✅ | Ranking-Position; numerisch (`1`–`15`) oder `World Champion` |
| `fighterId` | String | ✅ | Referenz auf `<fighter id>` |

---

## Vollständiges XML-Beispiel (vereinfacht)

```xml
<?xml version='1.0' encoding='utf-8'?>
<mtRankings>
  <organisations>
    <organisation id="org-wbc">
      <name>WBC Muay Thai</name>
      <website>https://www.wbcmuaythai.com/male</website>
      <weightClasses>
        <weightClass id="wbc-middleweight">
          <name>Middleweight</name>
          <limit unit="lb">160</limit>
          <limit unit="kg">72.575</limit>
        </weightClass>
        <weightClass id="wbc-welterweight">
          <name>Welterweight</name>
          <limit unit="lb">147</limit>
          <limit unit="kg">66.678</limit>
        </weightClass>
      </weightClasses>
    </organisation>
  </organisations>

  <fighters>
    <fighter id="fighter-example-a">
      <name>Example Fighter A</name>
      <country>Thailand</country>
      <age>27</age>
      <record>45-5-2</record>
    </fighter>
    <fighter id="fighter-example-b">
      <name>Example Fighter B</name>
      <country>France</country>
      <age>30</age>
      <record>32-8-1</record>
    </fighter>
  </fighters>

  <rankings>
    <ranking organisationId="org-wbc" weightClassId="wbc-middleweight" updatedAt="2025-12-01">
      <sourceUrl>https://www.wbcmuaythai.com/male</sourceUrl>
      <entry position="World Champion" fighterId="fighter-example-a" />
      <entry position="1" fighterId="fighter-example-b" />
    </ranking>
  </rankings>
</mtRankings>
```

---

## Gewichtsklassen der aktuellen Organisationen

### WBC Muay Thai (`org-wbc`) – 17 Gewichtsklassen

| ID | Name | Limit (lb) | Limit (kg) |
|---|---|---:|---:|
| `wbc-heavyweight` | Heavyweight | 200 | 91.0 |
| `wbc-cruiserweight` | Cruiserweight | 200 | 90.719 |
| `wbc-lt-heavyweight` | Lt. Heavyweight | 175 | 79.379 |
| `wbc-super-middleweight` | Super Middleweight | 168 | 76.204 |
| `wbc-middleweight` | Middleweight | 160 | 72.575 |
| `wbc-super-welterweight` | Super Welterweight | 154 | 69.853 |
| `wbc-welterweight` | Welterweight | 147 | 66.678 |
| `wbc-super-lightweight` | Super Lightweight | 140 | 63.503 |
| `wbc-lightweight` | Lightweight | 135 | 61.235 |
| `wbc-super-featherweight` | Super Featherweight | 130 | 58.967 |
| `wbc-featherweight` | Featherweight | 126 | 57.153 |
| `wbc-super-bantamweight` | Super Bantamweight | 122 | 55.338 |
| `wbc-bantamweight` | Bantamweight | 118 | 53.524 |
| `wbc-super-flyweight` | Super Flyweight | 115 | 52.163 |
| `wbc-flyweight` | Flyweight | 112 | – |
| *(weitere)* | *(siehe XML-Datei)* | | |

### Rajadamnern World Series (`org-rws`) – 16 Gewichtsklassen

| ID | Name | Limit |
|---|---|---|
| `rws-middleweight` | Middleweight | — |
| `rws-super-welterweight` | Super Welterweight | — |
| `rws-welterweight` | Welterweight | — |
| `rws-super-lightweight` | Super Lightweight | — |
| `rws-lightweight` | Lightweight | — |
| `rws-super-featherweight` | Super Featherweight | — |
| `rws-featherweight` | Featherweight | — |
| `rws-super-bantamweight` | Super Bantamweight | — |
| `rws-bantamweight` | Bantamweight | — |
| `rws-super-flyweight` | Super Flyweight | — |
| `rws-flyweight` | Flyweight | — |
| `rws-light-flyweight` | Light Flyweight | — |
| `rws-minimumweight` | Minimumweight | — |
| `rws-female-bantamweight` | Female Bantamweight | — |
| `rws-female-flyweight` | Female Flyweight | — |
| `rws-female-minimumweight` | Female Minimumweight | — |

---

## MongoDB-Schema

Nach dem Sync-Prozess werden die Daten in folgenden Collections gespeichert:

### Collection: `organisations`

```json
{
  "_id": "org-wbc",
  "name": "WBC Muay Thai",
  "website": "https://www.wbcmuaythai.com/male",
  "weightClasses": [
    {
      "id": "wbc-middleweight",
      "name": "Middleweight",
      "limits": [
        { "unit": "lb", "value": "160" },
        { "unit": "kg", "value": "72.575" }
      ]
    }
  ]
}
```

### Collection: `rankings`

Jedes Dokument entspricht einer Ranking-Liste (Organisation + Gewichtsklasse):

```json
{
  "organisationId": "org-wbc",
  "weightClassId": "wbc-middleweight",
  "updatedAt": "2025-12-01",
  "sourceUrl": "https://www.wbcmuaythai.com/male",
  "entries": [
    { "position": "World Champion", "fighterId": "fighter-example-a" },
    { "position": "1", "fighterId": "fighter-example-b" }
  ]
}
```

### Collection: `fighters`

Das Fighter-Dokument enthält Stammdaten plus eingebettete Ranking-Einträge:

```json
{
  "_id": "fighter-petchmorakot",
  "name": "Petchmorakot Bangmadklongtan",
  "country": "Thailand",
  "nationalities": ["Thailand"],
  "normalizedName": "petchmorakotbangmadklongtan",
  "aliases": ["fighter-petchmorakot", "rws-petchmorakot-bangmadklongtan"],
  "age": 23,
  "record": "48-4-0",
  "rankings": [
    {
      "orgId": "org-wbc",
      "org": "WBC Muay Thai",
      "weightClassId": "wbc-middleweight",
      "weightClassName": "Middleweight",
      "position": "World Champion"
    },
    {
      "orgId": "org-rws",
      "org": "Rajadamnern World Series",
      "weightClassId": "rws-middleweight",
      "weightClassName": "Middleweight",
      "position": "1"
    }
  ]
}
```

**Felder im Fighter-Dokument:**

| Feld | Typ | Herkunft | Beschreibung |
|---|---|---|---|
| `_id` | String | XML | Kanonische ID (erste Org die den Fighter erfasst hat) |
| `name` | String | XML | Anzeigename |
| `country` | String | XML | Legacy-Feld; Klartextname des Landes |
| `nationalities` | String[] | XML / Admin | ISO-Codes oder Klartextnamen; bevorzugtes Feld für Anzeige |
| `normalizedName` | String | Berechnet | Kleinbuchstaben, nur alphanumerisch – für Dedup-Vergleich |
| `aliases` | String[] | Berechnet | Alle bekannten IDs dieses Fighters (aus beiden Orgs) |
| `age` | Number | XML | Alter; `null` wenn nicht vorhanden |
| `record` | String | XML | Kampfrekord `W-L-D`; `null` wenn nicht vorhanden |
| `rankings` | Object[] | Berechnet | Eingebettete Ranking-Einträge aus allen Orgs |

---

## Dedup-Logik: Fighter-Zusammenführung über Organisationen

Das grösste technische Problem ist, dass derselbe Kämpfer in beiden Organisationen mit unterschiedlichen IDs erfasst sein kann:
- WBC-Datei: `fighter-petchmorakot-wangchanglek`
- RWS-Datei: `rws-petchmorakot-bangmadklongtan`

Dies sind möglicherweise dieselbe Person. Die Dedup-Logik (`src/routes/api/admin/scrape/+server.js` und `/rws/+server.js`) verhindert doppelte Dokumente:

### Schritt 1: Name normalisieren

```js
// src/lib/server/xmlParser.js
export const normalizeForDedup = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, '');
// "Petchmorakot Bangmadklongtan" → "petchmorakotbangmadklongtan"
```

### Schritt 2: Existierendes Dokument suchen

Für jeden Fighter aus der XML-Datei wird in MongoDB nach einer Übereinstimmung gesucht:

```js
const existing = await fightersCol.findOne({
    $or: [
        { _id: fighter._id },           // gleiche ID (Re-Sync)
        { normalizedName: normalized }, // gleicher normalisierter Name (cross-org)
        { aliases: fighter._id }        // ID bereits als Alias bekannt
    ]
});
```

### Schritt 3a: Treffer gefunden – Merge

- Die neue XML-ID wird als `alias` hinzugefügt (`$addToSet`)
- Fehlende Felder (Alter, Rekord, Nationalitäten) werden ergänzt, wenn im XML vorhanden
- Das Dokument behält seine ursprüngliche `_id` (die ID der ersten Org, die den Fighter erfasst hat)
- Die `idMap` speichert die Zuordnung: XML-ID → kanonische MongoDB-ID

```js
idMap.set(fighter._id, existing._id);
await fightersCol.updateOne(
    { _id: existing._id },
    {
        $addToSet: { aliases: fighter._id },
        $set: {
            normalizedName: normalizeForDedup(existing.name),
            ...(fighter.nationalities?.length && { nationalities: fighter.nationalities }),
            ...(fighter.age != null && { age: fighter.age }),
            ...(fighter.record && { record: fighter.record })
        }
    }
);
```

### Schritt 3b: Kein Treffer – Neues Dokument erstellen

```js
idMap.set(fighter._id, fighter._id);
await fightersCol.replaceOne(
    { _id: fighter._id },
    { ...fighter, normalizedName: normalized, aliases: [fighter._id] },
    { upsert: true }
);
```

### Schritt 4: Ranking-Einträge auf kanonischen Fighter schreiben

Die `idMap` stellt sicher, dass Ranking-Einträge immer an das kanonische Dokument gebunden werden, unabhängig davon ob eine WBC- oder RWS-ID in der XML-Datei verwendet wird:

```js
// Stale-Einträge dieser Org entfernen
await fightersCol.updateMany({}, { $pull: { rankings: { orgId } } });

// Aktuelle Einträge einbetten
for (const [canonicalId, entries] of fighterRankingsMap) {
    await fightersCol.updateOne(
        { _id: canonicalId },
        { $addToSet: { rankings: { $each: entries } } }
    );
}
```

Dieser Mechanismus sorgt dafür, dass beim erneuten Sync nur die Einträge der gerade synchronisierten Organisation überschrieben werden. Einträge der anderen Organisation bleiben unberührt.

---

## Trennung von Fighter-Stammdaten und Ranking-Einträgen

Fighter-Stammdaten werden einmalig in `<fighters>` definiert. Ranking-Einträge in `<rankings>` referenzieren Fighter nur per ID. Dieses Prinzip gilt sowohl im XML als auch in MongoDB (Collection `rankings` und eingebettetes `rankings[]`-Array im Fighter-Dokument).

**Vorteile:**
- Namensänderungen, Alters- oder Rekord-Updates sind an einer einzigen Stelle nötig
- Ein Fighter kann in mehreren Organisationen und Gewichtsklassen gelistet sein, ohne Doppelerfassung
- Die Trennung ermöglicht separate Sync-Zyklen: Stammdaten und Rankings können unabhängig aktualisiert werden

**Gewichtsklassen** sind bewusst organisationsspezifisch: Auch wenn zwei Organisationen die gleiche Gewichtsklassenbezeichnung verwenden (z. B. «Middleweight»), haben die Klassen unterschiedliche IDs und können unterschiedliche Gewichtslimits haben.
