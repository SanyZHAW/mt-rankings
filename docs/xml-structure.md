# MT Rankings - XML Data Structure

## XML Data Model

The MT Rankings prototype uses a manually maintainable XML file for fighter and ranking data. The structure separates stable fighter master data from ranking entries, so the same fighter can appear in multiple rankings without duplicating personal details.

The XML model supports:

- organisations
- organisation-specific weight classes
- fighters
- ranking entries

This structure is simple enough to edit manually during the prototype phase, but still structured enough to support automatic extraction from external ranking websites later.

Later sample data should be based on these sources:

- RWS rankings: `https://rank.rajadamnern.com/rankings`
- WBC Muay Thai male rankings: `https://www.wbcmuaythai.com/male`

## Main XML Sections

The root element is `<mtRankings>`.

Recommended main sections:

- `<organisations>` contains all ranking organisations and their own weight classes.
- `<fighters>` contains fighter master data.
- `<rankings>` contains ranking lists grouped by organisation and weight class.

## Required Fields

### Organisation

Each organisation needs:

- `id`: unique organisation ID
- `name`: organisation name
- `website`: optional source or official website URL
- `weightClasses`: weight classes that belong to this organisation

### Weight Class

Each weight class belongs to exactly one organisation and needs:

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

This is a simplified structure example. It shows the intended XML shape and references between sections. The actual real sample XML data will be created in Issue #3 and should be checked against the source websites.

```xml
<mtRankings>
  <organisations>
    <organisation id="org-rws">
      <name>RWS</name>
      <website>https://rank.rajadamnern.com/rankings</website>
      <weightClasses>
        <weightClass id="rws-middleweight">
          <name>Middleweight</name>
        </weightClass>
        <weightClass id="rws-class-2">
          <name>RWS Example Weight Class 2</name>
        </weightClass>
        <weightClass id="rws-class-3">
          <name>RWS Example Weight Class 3</name>
        </weightClass>
      </weightClasses>
    </organisation>

    <organisation id="org-wbc">
      <name>WBC Muay Thai</name>
      <website>https://www.wbcmuaythai.com/male</website>
      <weightClasses>
        <weightClass id="wbc-middleweight">
          <name>Middleweight</name>
          <limit unit="lb">160</limit>
        </weightClass>
        <weightClass id="wbc-super-welterweight">
          <name>Super Welterweight</name>
          <limit unit="lb">154</limit>
        </weightClass>
        <weightClass id="wbc-welterweight">
          <name>Welterweight</name>
          <limit unit="lb">147</limit>
        </weightClass>
      </weightClasses>
    </organisation>
  </organisations>

  <fighters>
    <fighter id="fighter-example-a">
      <name>Example Fighter A</name>
      <country>Thailand</country>
      <record>20-3-0</record>
    </fighter>
    <fighter id="fighter-example-b">
      <name>Example Fighter B</name>
      <country>France</country>
      <record>18-4-1</record>
    </fighter>
  </fighters>

  <rankings>
    <ranking organisationId="org-rws" weightClassId="rws-middleweight" updatedAt="2026-05-01">
      <sourceUrl>https://rank.rajadamnern.com/rankings</sourceUrl>
      <entry position="1" fighterId="fighter-example-a" />
      <entry position="2" fighterId="fighter-example-b" />
    </ranking>

    <ranking organisationId="org-wbc" weightClassId="wbc-super-welterweight" updatedAt="2026-05-01">
      <sourceUrl>https://www.wbcmuaythai.com/male</sourceUrl>
      <entry position="3" fighterId="fighter-example-a" />
    </ranking>
  </rankings>
</mtRankings>
```

## Why Fighter Data and Ranking Entries Are Separated

Fighter master data is separated from ranking entries to avoid duplicate fighter information. A fighter has one master record in `<fighters>`, and rankings only reference that fighter by ID.

This is important because one fighter can appear:

- in multiple organisations
- in the same or different weight classes depending on the organisation
- in multiple ranking lists over time

With this structure, updating a fighter's name, country, or record only needs to happen once. Ranking entries remain focused on ranking-specific data such as organisation, weight class, position, source URL, and update date.

The separation also makes future automated extraction easier. External ranking pages can be parsed into ranking entries, while fighter matching and fighter master data can be handled separately.

Weight classes are kept inside their organisation because different organisations can use different names, limits, and definitions. Even if two organisations use a similar class name, each class should have its own organisation-specific ID.
