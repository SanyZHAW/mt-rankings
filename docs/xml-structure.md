# MT Rankings - XML Data Structure

## XML Data Model

The MT Rankings prototype uses a manually maintainable XML file for fighter and ranking data. The structure separates stable fighter master data from ranking entries, so the same fighter can appear in multiple rankings without duplicating personal details.

The XML model supports:

- organisations
- weight classes
- fighters
- ranking entries

This structure is simple enough to edit manually during the prototype phase, but still structured enough to support automatic extraction from external ranking websites later.

## Main XML Sections

The root element is `<mtRankings>`.

Recommended main sections:

- `<organisations>` contains all ranking organisations.
- `<weightClasses>` contains reusable weight class definitions.
- `<fighters>` contains fighter master data.
- `<rankings>` contains ranking lists grouped by organisation and weight class.

## Required Fields

### Organisation

Each organisation needs:

- `id`: unique organisation ID
- `name`: organisation name
- `website`: optional source or official website URL

### Weight Class

Each weight class needs:

- `id`: unique weight class ID
- `name`: display name
- `limit`: optional weight limit
- `unit`: optional weight unit, for example `kg` or `lb`

### Fighter

Each fighter needs:

- `id`: unique fighter ID used by ranking entries
- `name`: fighter display name
- `country`: optional country
- `record`: optional fight record

### Ranking Entry

Each ranking entry needs:

- `position`: ranking position
- `fighterId`: reference to a fighter from `<fighters>`

Each ranking list also needs:

- `organisationId`: reference to an organisation
- `weightClassId`: reference to a weight class
- `sourceUrl`: optional URL for the external ranking source
- `updatedAt`: optional date when the ranking was last checked or updated

## Example XML Snippet

```xml
<mtRankings>
  <organisations>
    <organisation id="org-rws">
      <name>RWS</name>
      <website>https://rajadamnern.com/</website>
    </organisation>
    <organisation id="org-wbc">
      <name>WBC Muay Thai</name>
      <website>https://www.wbcmuaythai.com/</website>
    </organisation>
  </organisations>

  <weightClasses>
    <weightClass id="wc-featherweight">
      <name>Featherweight</name>
      <limit unit="lb">126</limit>
    </weightClass>
    <weightClass id="wc-lightweight">
      <name>Lightweight</name>
      <limit unit="lb">135</limit>
    </weightClass>
  </weightClasses>

  <fighters>
    <fighter id="fighter-smith">
      <name>Alex Smith</name>
      <country>United Kingdom</country>
      <record>25-4-1</record>
    </fighter>
    <fighter id="fighter-sato">
      <name>Ren Sato</name>
      <country>Japan</country>
      <record>18-2-0</record>
    </fighter>
  </fighters>

  <rankings>
    <ranking organisationId="org-rws" weightClassId="wc-featherweight" updatedAt="2026-05-01">
      <sourceUrl>https://example.com/rws-featherweight-ranking</sourceUrl>
      <entry position="1" fighterId="fighter-smith" />
      <entry position="2" fighterId="fighter-sato" />
    </ranking>

    <ranking organisationId="org-wbc" weightClassId="wc-lightweight" updatedAt="2026-05-01">
      <sourceUrl>https://example.com/wbc-lightweight-ranking</sourceUrl>
      <entry position="3" fighterId="fighter-smith" />
    </ranking>
  </rankings>
</mtRankings>
```

## Why Fighter Data and Ranking Entries Are Separated

Fighter master data is separated from ranking entries to avoid duplicate fighter information. A fighter has one master record in `<fighters>`, and rankings only reference that fighter by ID.

This is important because one fighter can appear:

- in multiple organisations
- in different weight classes depending on the organisation
- in multiple ranking lists over time

With this structure, updating a fighter's name, country, or record only needs to happen once. Ranking entries remain focused on ranking-specific data such as organisation, weight class, position, source URL, and update date.

The separation also makes future automated extraction easier. External ranking pages can be parsed into ranking entries, while fighter matching and fighter master data can be handled separately.
