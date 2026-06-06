# MT Rankings - Routes and Information Architecture

## Project Description

MT Rankings is a SvelteKit prototype for comparing Muay Thai rankings across different organisations. The app helps fans, fighters, coaches, and analysts understand how rankings differ between organisations such as RWS, ONE Championship, and WBC Muay Thai.

The prototype focuses on a clear end-to-end workflow: users start on the home page, select an organisation and weight class, view a ranking list, open a fighter detail page, and manage personal favorites after login.

## Data Architecture Decision

For this prototype, fighter and ranking data comes from a manually created XML file. This keeps the ranking data easy to maintain during prototyping while still allowing a structured format that could later support automated extraction from external ranking websites.

MongoDB is used for real persistence of user-related data:

- users
- login/register data
- user-specific favorite fighter IDs

This means rankings and fighter master data are read from XML, while accounts and favorites are stored in MongoDB.

## Main Workflow

1. User opens the home page.
2. User navigates to the rankings page.
3. User selects an organisation.
4. User selects a weight class after choosing an organisation.
5. User sees the ranking list for the selected organisation and weight class.
6. User clicks a fighter name in the ranking list.
7. User opens the fighter detail page.
8. User sees fighter master data and all ranking entries for that fighter.
9. User can see a favorite button on the fighter detail page.
10. If the user is not logged in, the favorite button is visible but disabled or greyed out.
11. If the user is logged in, the favorite button is enabled and saves the fighter to that user's favorites.
12. Logged-in users can open the favorites page.
13. The favorites page shows the logged-in user's saved fighters as cards.

## Planned Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Home page with project introduction and link to rankings | Public |
| `/rankings` | Ranking workflow with organisation and weight class selection | Public |
| `/fighters/[id]` | Fighter detail page with master data, ranking entries, and favorite action | Public |
| `/favorites` | User-specific favorites overview using cards | Logged-in users only |
| `/login` | Login page | Public |
| `/register` | Registration page | Public |

## Navigation Logic

The main navigation should make the primary workflow easy to follow:

- The home page links clearly to `/rankings`.
- The rankings page is the main entry point for exploring fighter rankings.
- The favorites page is only visible in the navigation when a user is logged in.
- Login and register links are visible when no user is logged in.
- When a user is logged in, the navigation should show the user's logged-in state and provide access to favorites.

## Rankings Page Flow

The rankings page guides the user through the selection process in a fixed order:

1. Select an organisation.
2. Select a weight class that belongs to the selected organisation.
3. Display the ranking list after both selections are made.

The weight class selection should appear after an organisation is selected, because available weight classes depend on the selected organisation.

The ranking list should show ranking positions and fighter names. Fighter names are clickable and open the matching fighter detail page at `/fighters/[id]`.

## Fighter Detail Page

The fighter detail page shows fighter master data from the XML data source. It also lists all ranking entries for that fighter, because one fighter can appear in multiple organisations and weight classes.

Each ranking entry should show:

- organisation
- weight class
- ranking position

The favorite button is always visible on the fighter detail page. If the user is not logged in, the button is disabled or greyed out and the page should communicate that favorites require login.

## Favorites Page

Favorites require login. The favorites page is only visible and accessible for logged-in users.

Favorites are user-specific. Each user only sees fighters saved by their own account.

The favorites page should use a card layout instead of a ranking list, because favorites are a personal collection and are not tied to one selected organisation or weight class. Each card should represent one saved fighter and can link back to the fighter detail page.
