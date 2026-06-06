"""
RWS (Rajadamnern) World Rankings Scraper
Scrapes https://rank.rajadamnern.com/rankings — all weight classes — and
writes static/data/rws_rankings.xml.

Requires: playwright beautifulsoup4
Install:  pip install playwright beautifulsoup4 && python -m playwright install chromium
Run:      python static/scripts/scrape_rws.py
"""

import re
import sys
from pathlib import Path
from datetime import date
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://rank.rajadamnern.com/rankings"
ORG_ID   = "org-rws"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "rws_rankings.xml"

# ISO 3166-1 alpha-2 → country name (flag-icons library uses these codes)
ISO_COUNTRIES = {
    "af": "Afghanistan", "al": "Albania", "am": "Armenia", "ar": "Argentina",
    "at": "Austria", "au": "Australia", "az": "Azerbaijan", "ba": "Bosnia",
    "bd": "Bangladesh", "be": "Belgium", "bg": "Bulgaria", "bh": "Bahrain",
    "bo": "Bolivia", "br": "Brazil", "by": "Belarus", "ca": "Canada",
    "ch": "Switzerland", "cl": "Chile", "cn": "China", "co": "Colombia",
    "cz": "Czech Republic", "de": "Germany", "dk": "Denmark", "dz": "Algeria",
    "ec": "Ecuador", "ee": "Estonia", "eg": "Egypt", "es": "Spain",
    "et": "Ethiopia", "fi": "Finland", "fr": "France", "gb": "United Kingdom",
    "ge": "Georgia", "gh": "Ghana", "gr": "Greece", "gt": "Guatemala",
    "hk": "Hong Kong", "hr": "Croatia", "hu": "Hungary", "id": "Indonesia",
    "ie": "Ireland", "il": "Israel", "in": "India", "iq": "Iraq",
    "ir": "Iran", "is": "Iceland", "it": "Italy", "jp": "Japan",
    "kh": "Cambodia", "kp": "North Korea", "kr": "South Korea", "kw": "Kuwait",
    "kz": "Kazakhstan", "la": "Laos", "lb": "Lebanon", "lk": "Sri Lanka",
    "lt": "Lithuania", "lv": "Latvia", "ma": "Morocco", "md": "Moldova",
    "me": "Montenegro", "mk": "North Macedonia", "mm": "Myanmar", "mn": "Mongolia",
    "mo": "Macao", "mr": "Mauritania", "mt": "Malta", "mx": "Mexico",
    "my": "Malaysia", "ng": "Nigeria", "nl": "Netherlands", "no": "Norway",
    "np": "Nepal", "nz": "New Zealand", "om": "Oman", "pe": "Peru",
    "ph": "Philippines", "pk": "Pakistan", "pl": "Poland", "pt": "Portugal",
    "qa": "Qatar", "ro": "Romania", "rs": "Serbia", "ru": "Russia",
    "sa": "Saudi Arabia", "sd": "Sudan", "se": "Sweden", "sg": "Singapore",
    "si": "Slovenia", "sk": "Slovakia", "sn": "Senegal", "so": "Somalia",
    "th": "Thailand", "tj": "Tajikistan", "tm": "Turkmenistan", "tn": "Tunisia",
    "tr": "Turkey", "tw": "Taiwan", "tz": "Tanzania", "ua": "Ukraine",
    "ug": "Uganda", "us": "United States", "uz": "Uzbekistan", "ve": "Venezuela",
    "vn": "Vietnam", "ye": "Yemen", "za": "South Africa", "zm": "Zambia",
    "zm": "Zimbabwe",
}


# ── helpers ────────────────────────────────────────────────────────────────────

def fighter_id(name: str) -> str:
    slug = re.sub(r"['''’`]", "", name.lower())
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return f"rws-{slug.strip('-')}"


def weight_class_id(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower())
    return f"rws-{slug.strip('-')}"


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def is_vacant(name: str) -> bool:
    return not name or "vacant" in name.lower()


def country_from_flag_span(container) -> str:
    """Find the first fi-XX span in `container` and return the full country name."""
    for span in container.find_all("span"):
        for cls in span.get("class", []):
            if cls.startswith("fi-") and len(cls) == 5:
                code = cls[3:]  # "fi-ru" → "ru"
                return ISO_COUNTRIES.get(code, code.upper())
    return ""


# ── weight class discovery ─────────────────────────────────────────────────────

def discover_weight_classes(html: str) -> list[str]:
    """
    The page embeds a weightClassList JSON blob inside a Next.js script tag.
    It looks like: \\"value_1\\":\\"Middleweight\\" (double-escaped in the HTML).
    Extract all value_1 entries in that bloc.
    """
    idx = html.find("weightClassList")
    if idx < 0:
        print("  WARNING: weightClassList not found in HTML — using fallback")
        return _fallback_weight_classes()

    # Read up to 5 KB after the marker to capture the whole list
    blob = html[idx: idx + 5000]

    # The JSON is double-escaped: \" appears as \\\" in the raw HTML bytes,
    # which Python reads as \\" in the str.  Pattern: \\"value_1\\":\\"NAME\\"
    wcs = re.findall(r'\\"value_1\\":\\"([^\\"]+)\\"', blob)

    if not wcs:
        print("  WARNING: no value_1 entries found — using fallback")
        return _fallback_weight_classes()

    # Filter to weight-class-like names (avoid duplicates)
    seen = []
    for w in wcs:
        if w not in seen:
            seen.append(w)
    print(f"  Found {len(seen)} weight classes from embedded JSON: {seen}")
    return seen


def _fallback_weight_classes() -> list[str]:
    classes = [
        "Strawweight", "Minimumweight", "Light Flyweight", "Flyweight",
        "Super Flyweight", "Bantamweight", "Super Bantamweight", "Featherweight",
        "Super Featherweight", "Lightweight", "Super Lightweight", "Welterweight",
        "Super Welterweight", "Middleweight", "Super Middleweight",
        "Light Heavyweight", "Heavyweight",
    ]
    print(f"  Using fallback list: {classes}")
    return classes


# ── parse a single weight-class rankings page ──────────────────────────────────

def scrape_weight_class(page, weight_class: str) -> tuple[dict | None, list[dict]]:
    url = f"{BASE_URL}?weight={weight_class.replace(' ', '+')}"
    page.goto(url, wait_until="networkidle", timeout=30_000)
    page.wait_for_timeout(2_000)

    soup = BeautifulSoup(page.content(), "html.parser")

    # ── Champion (shown above the numbered list) ──
    champion = None
    champ_h2 = soup.find(
        "h2",
        class_=lambda c: c and "text-white" in c and "truncate" in c,
    )
    if champ_h2:
        name = clean(champ_h2.get_text())
        if name and not is_vacant(name):
            # Country is in the sibling/parent container
            country = country_from_flag_span(champ_h2.parent)
            champion = {"name": name, "country": country}

    # ── Numbered ranked fighters ──
    # Each is an <a href="/fighters/FT_..."> row with:
    #   - <div class="w-5"><h1>POSITION</h1></div>
    #   - <div class="flex flex-col ..."><h1>NAME</h1></div>
    #   - <span class="fi fi-XX"> for country
    fighters = []
    seen_names: set[str] = set()

    for a_tag in soup.find_all("a", href=re.compile(r"^/fighters/")):
        # Position
        pos_div = a_tag.find("div", class_="w-5")
        if not pos_div:
            continue
        pos_h1 = pos_div.find("h1")
        if not pos_h1:
            continue
        pos = clean(pos_h1.get_text())
        if not pos.isdigit():
            continue

        # Name (h1 inside a div that has "flex-col" in its classes)
        name_div = a_tag.find(
            "div",
            class_=lambda c: c and "flex-col" in c,
        )
        if not name_div:
            continue
        name_h1 = name_div.find("h1")
        if not name_h1:
            continue
        name = clean(name_h1.get_text())
        if not name or is_vacant(name) or name in seen_names:
            continue
        seen_names.add(name)

        # Country
        country = country_from_flag_span(a_tag)

        fighters.append({
            "position": pos,
            "name":     name,
            "country":  country,
            "age":      "",
            "record":   "",
        })

    return champion, fighters


# ── XML builder ────────────────────────────────────────────────────────────────

def build_xml(scraped: list[tuple[str, dict | None, list[dict]]]) -> Element:
    today = date.today().isoformat()
    root = Element("mtRankings")

    # organisations block
    orgs_el = SubElement(root, "organisations")
    org_el  = SubElement(orgs_el, "organisation", id=ORG_ID)
    SubElement(org_el, "name").text    = "Rajadamnern World Series"
    SubElement(org_el, "website").text = "https://rank.rajadamnern.com"
    wc_container = SubElement(org_el, "weightClasses")
    for wc_name, _, _ in scraped:
        wc_node = SubElement(wc_container, "weightClass", id=weight_class_id(wc_name))
        SubElement(wc_node, "name").text = wc_name

    # fighters block (de-duped by id)
    fighters_el = SubElement(root, "fighters")
    seen_ids: set[str] = set()

    def add_fighter(f: dict):
        fid = fighter_id(f["name"])
        if fid in seen_ids:
            return
        seen_ids.add(fid)
        f_el = SubElement(fighters_el, "fighter", id=fid)
        SubElement(f_el, "name").text = f["name"]
        if f.get("country"):
            SubElement(f_el, "country").text = f["country"]
        if f.get("age"):
            SubElement(f_el, "age").text = str(f["age"])
        if f.get("record"):
            SubElement(f_el, "record").text = f["record"]

    for _, champion, fighters in scraped:
        if champion:
            add_fighter(champion)
        for f in fighters:
            add_fighter(f)

    # rankings block
    rankings_el = SubElement(root, "rankings")
    for wc_name, champion, fighters in scraped:
        rk_el = SubElement(
            rankings_el, "ranking",
            organisationId=ORG_ID,
            weightClassId=weight_class_id(wc_name),
            updatedAt=today,
        )
        SubElement(rk_el, "sourceUrl").text = (
            f"{BASE_URL}?weight={wc_name.replace(' ', '+')}"
        )
        if champion:
            SubElement(rk_el, "entry",
                       position="Champion",
                       fighterId=fighter_id(champion["name"]))
        for f in fighters:
            SubElement(rk_el, "entry",
                       position=f["position"],
                       fighterId=fighter_id(f["name"]))

    return root


# ── main ───────────────────────────────────────────────────────────────────────

def main():
    print("RWS (Rajadamnern) World Rankings Scraper")
    print("=" * 40)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        # Load main page once to discover weight classes from the embedded JSON
        print(f"\nFetching {BASE_URL} ...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30_000)
        page.wait_for_timeout(2_000)
        html = page.content()

        weight_classes = discover_weight_classes(html)

        # Scrape each weight class
        scraped: list[tuple[str, dict | None, list[dict]]] = []
        for wc_name in weight_classes:
            print(f"\nScraping {wc_name!r} ...")
            champion, fighters = scrape_weight_class(page, wc_name)
            champ_str = champion["name"] if champion else "—"
            print(f"  champion={champ_str!r}  ranked={len(fighters)}")
            if champion or fighters:
                scraped.append((wc_name, champion, fighters))

        browser.close()

    if not scraped:
        print("\nERROR: No data scraped.")
        sys.exit(1)

    print(f"\nBuilding XML ({len(scraped)} weight classes) ...")
    root = build_xml(scraped)
    indent(root, space="  ")
    ElementTree(root).write(str(OUTPUT_FILE), encoding="utf-8", xml_declaration=True)
    print(f"Saved -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
