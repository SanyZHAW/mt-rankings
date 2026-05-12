# MT Rankings

MT Rankings is a SvelteKit prototype for comparing Muay Thai rankings from different organisations. The MVP focuses on a clear end-to-end workflow for browsing rankings, opening fighter details, and saving personal favorites.

## Project Idea

Muay Thai rankings differ between organisations such as RWS and WBC Muay Thai. Each organisation can use its own weight class names, limits, title positions, and ranking structure. This makes it difficult to compare fighters across organisations.

MT Rankings brings selected ranking data into one prototype application and makes the browsing workflow easier to understand.

## Main Workflow

Home -> select organisation -> select weight class -> ranking list -> fighter detail -> favorite -> favorites page

The user starts on the home page, opens the rankings page, selects an organisation, then selects one of that organisation's weight classes. The app shows a ranking list with clickable fighter names. A fighter detail page shows fighter master data and all ranking entries for that fighter. Logged-in users can add or remove fighters from their personal favorites and view them on the favorites page.

## Data Sources

Fighter and ranking data comes from:

```text
static/data/rankings.xml
```

The XML structure separates fighter master data from ranking entries. Ranking entries reference fighters by ID.

Weight classes are organisation-specific. This is important because different organisations can use different names, limits, and definitions. One fighter can appear in multiple organisations and weight classes.

Future extension: ranking data could be extracted automatically from external RWS and WBC Muay Thai pages and written into the same XML structure.

## MongoDB

MongoDB Atlas stores:

- users
- user-specific favorites

The app stores only favorite references, such as user ID and fighter ID. Full fighter data stays in the XML file.

MongoDB Compass is useful for checking and managing data locally, but it does not need to be open for the deployed app to work.

## Environment Variables

Required variables:

```env
DB_URI=your-mongodb-connection-string
DB_NAME=mt-rankings
```

Local environment variables are stored in `.env`. This file is ignored by Git and must not be committed.

Netlify must be configured with the same environment variable names and values as the local `.env` file:

- `DB_URI`
- `DB_NAME`

Use `.env.example` as the safe template.

## Local Setup

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev -- --open
```

## Build

Create a production build:

```sh
npm run build
```

## Deployment

The app is deployed on Netlify.

Deployment link:

https://muaythairankings.netlify.app/

GitHub repository:

https://github.com/SanyZHAW/mt-rankings

## Pages and Features

- `/` - home page and project introduction
- `/rankings` - organisation and weight class selection with ranking list
- `/fighters/[id]` - fighter detail page with all ranking entries for that fighter
- `/register` - basic user registration
- `/login` - basic user login
- `/favorites` - user-specific favorites page

## Implemented MVP Features

- organisation selection
- organisation-specific weight class selection
- ranking list from XML data
- fighter detail page
- XML parsing
- basic register/login with MongoDB users
- user-specific favorites with MongoDB persistence
- favorite toggle
- favorites displayed as cards
- reusable Svelte components
- Netlify deployment

## Fulfilled Project Requirements

- SvelteKit application
- reusable components
- XML data structure and parser
- MongoDB persistence for users and favorites
- Git/GitHub version control
- Netlify deployment
- clear end-to-end workflow
