"""
WBC Muay Thai Rankings Scraper
Scrapes https://www.wbcmuaythai.com/male — all weight classes — and overwrites
static/data/wbc_rankings.xml with the current rankings.

Requires: playwright beautifulsoup4
Install:  pip install playwright beautifulsoup4 && python -m playwright install chromium
Run:      python static/scripts/scrape_wbc.py
"""

import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import date
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://www.wbcmuaythai.com/male"
ORG_ID = "org-wbc"

# Overwrites this file on every run
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "wbc_rankings.xml"

# Matches "(147 lbs, 66.678 kg)", "(200 lbs, +91 kg)", "(112 lbs – 50.802 kgs)"
_LIMIT_RE = re.compile(
    r"\((\d+(?:\.\d+)?)\s*lbs?[\s,–\-]+\+?(\d+(?:\.\d+)?)\s*kgs?\)",
    re.IGNORECASE,
)


# ── helpers ───────────────────────────────────────────────────────────────────

def parse_fighter_name(raw: str) -> tuple[str, str]:
    """
    'Niall McGreevy (Ireland)'       → ('Niall McGreevy', 'Ireland')
    'Jonathan Aiulu (Australia)**'   → ('Jonathan Aiulu', 'Australia')
    'Petchmorakot Petchyindee'       → ('Petchmorakot Petchyindee', '')
    """
    raw = re.sub(r"\*+.*$", "", raw).strip()
    m = re.match(r"^(.+?)\s*\(([^)]+)\)\s*$", raw)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return raw.strip(), ""


def fighter_id(name: str) -> str:
    """'Niall McGreevy' → 'fighter-niall-mcgreevy'"""
    slug = name.lower()
    slug = re.sub(r"['']", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return f"fighter-{slug.strip('-')}"


def weight_class_id(name: str) -> str:
    """'Super Welterweight' → 'wbc-super-welterweight'"""
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return f"wbc-{slug.strip('-')}"


def _is_vacant(raw: str) -> bool:
    name, _ = parse_fighter_name(raw)
    return not name or "vacant" in name.lower()


# ── fetch ─────────────────────────────────────────────────────────────────────

def fetch_page(url: str) -> BeautifulSoup:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30_000)
        html = page.content()
        browser.close()
    return BeautifulSoup(html, "html.parser")


# ── weight-class discovery ────────────────────────────────────────────────────

def discover_weight_classes(soup: BeautifulSoup) -> list[dict]:
    """
    Scan every et_pb_row that has an <h3> and return one dict per weight class:
    {id, name, lb, kg}  — lb/kg are None when the limit text can't be parsed.
    """
    result = []
    seen: set[str] = set()

    for row in soup.find_all("div", class_="et_pb_row"):
        h3 = row.find("h3")
        if not h3:
            continue
        key = h3.get_text(strip=True).upper()
        if key in seen:
            continue
        seen.add(key)

        name = key.title()  # "SUPER WELTERWEIGHT" → "Super Welterweight"

        lb, kg = None, None
        p = h3.find_next_sibling("p")
        if p:
            m = _LIMIT_RE.search(p.get_text())
            if m:
                lb = round(float(m.group(1)))
                kg = float(m.group(2))

        result.append({"id": weight_class_id(name), "name": name, "lb": lb, "kg": kg})

    return result


# ── scraping logic ────────────────────────────────────────────────────────────

_TITLE_KEYWORDS = ("CHAMPION", "INTERCONTINENTAL", "INTERNATIONAL", "EUROPEAN")


def _parse_title_blocks(col_div) -> tuple[tuple, list]:
    """
    Parse champion + special-title blocks from the middle column of a weight-class row.
    Returns ((world_title, raw_name), [(other_title, raw_name), ...]).
    Titles are Title Case; Vacant slots are dropped.
    """
    world = (None, None)
    others = []
    current_title = None

    for el in col_div.find_all(["h4", "p"]):
        text = el.get_text(strip=True)
        if not text:
            continue
        is_title_header = bool(el.find("strong")) and any(kw in text.upper() for kw in _TITLE_KEYWORDS)
        if is_title_header:
            current_title = text.title()
        elif current_title:
            if "Won Title" not in text and not _is_vacant(text):
                if "world" in current_title.lower():
                    world = (current_title, text)
                else:
                    others.append((current_title, text))
            current_title = None

    return world, others


def scrape_all_rows(soup: BeautifulSoup) -> dict:
    """
    Parse every weight-class row on the page.
    Returns {UPPERCASE_NAME: data_dict}.
    """
    results = {}
    for row in soup.find_all("div", class_="et_pb_row"):
        h3 = row.find("h3")
        if not h3:
            continue
        key = h3.get_text(strip=True).upper()
        cols = row.find_all("div", recursive=False)
        if len(cols) < 2:
            continue

        (champ_title, champ_raw), other_titles = _parse_title_blocks(cols[1])

        ranked = []
        if len(cols) > 2:
            ol = cols[2].find("ol", class_="listrank")
            if ol:
                for pos, li in enumerate(ol.find_all("li"), start=1):
                    raw = li.get_text(strip=True)
                    if raw and not _is_vacant(raw):
                        ranked.append((str(pos), raw))

        results[key] = {
            "champion_title": champ_title,
            "champion_raw":   champ_raw,
            "other_titles":   other_titles,
            "ranked":         ranked,
            "source_url":     BASE_URL,
        }

    return results


# ── XML builder ───────────────────────────────────────────────────────────────

def build_xml(scraped: list[tuple[dict, dict]]) -> Element:
    today = date.today().isoformat()
    root = Element("mtRankings")

    # organisations
    orgs_el = SubElement(root, "organisations")
    org_el = SubElement(orgs_el, "organisation", id=ORG_ID)
    SubElement(org_el, "name").text = "WBC Muay Thai"
    SubElement(org_el, "website").text = BASE_URL
    wc_el = SubElement(org_el, "weightClasses")
    for wc, _ in scraped:
        wc_node = SubElement(wc_el, "weightClass", id=wc["id"])
        SubElement(wc_node, "name").text = wc["name"]
        if wc["lb"] is not None:
            SubElement(wc_node, "limit", unit="lb").text = str(wc["lb"])
        if wc["kg"] is not None:
            SubElement(wc_node, "limit", unit="kg").text = str(wc["kg"])

    # fighters (de-duped by id)
    fighters_el = SubElement(root, "fighters")
    seen_ids: set[str] = set()

    def add_fighter(raw_name: str):
        name, country = parse_fighter_name(raw_name)
        if not name:
            return
        fid = fighter_id(name)
        if fid not in seen_ids:
            seen_ids.add(fid)
            f_el = SubElement(fighters_el, "fighter", id=fid)
            SubElement(f_el, "name").text = name
            if country:
                SubElement(f_el, "country").text = country

    for _, data in scraped:
        if data["champion_raw"]:
            add_fighter(data["champion_raw"])
        for _, raw in data["other_titles"]:
            add_fighter(raw)
        for _, raw in data["ranked"]:
            add_fighter(raw)

    # rankings
    rankings_el = SubElement(root, "rankings")
    for wc, data in scraped:
        rk_el = SubElement(
            rankings_el, "ranking",
            organisationId=ORG_ID,
            weightClassId=wc["id"],
            updatedAt=today,
        )
        SubElement(rk_el, "sourceUrl").text = data["source_url"]

        if data["champion_raw"]:
            name, _ = parse_fighter_name(data["champion_raw"])
            SubElement(rk_el, "entry",
                       position=data["champion_title"],
                       fighterId=fighter_id(name))

        for title, raw in data["other_titles"]:
            name, _ = parse_fighter_name(raw)
            if name:
                SubElement(rk_el, "entry", position=title, fighterId=fighter_id(name))

        for pos, raw in data["ranked"]:
            name, _ = parse_fighter_name(raw)
            if name:
                SubElement(rk_el, "entry", position=pos, fighterId=fighter_id(name))

    return root


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("WBC Muay Thai Rankings Scraper")
    print("=" * 40)

    print(f"\nFetching {BASE_URL} ...")
    soup = fetch_page(BASE_URL)

    weight_classes = discover_weight_classes(soup)
    print(f"Discovered {len(weight_classes)} weight classes")

    all_rows = scrape_all_rows(soup)

    scraped = []
    for wc in weight_classes:
        data = all_rows.get(wc["name"].upper())
        if data is None:
            print(f"  WARNING: no row data found for {wc['name']}")
            continue
        champ = data["champion_raw"] or "Vacant"
        print(f"  {wc['name']:25} champion={champ!r:40} ranked={len(data['ranked'])}")
        scraped.append((wc, data))

    print(f"\nBuilding XML ({len(scraped)} weight classes) ...")
    root = build_xml(scraped)
    indent(root, space="  ")

    tree = ElementTree(root)
    tree.write(str(OUTPUT_FILE), encoding="utf-8", xml_declaration=True)
    print(f"Saved -> {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
