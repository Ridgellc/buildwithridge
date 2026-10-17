"""Builds the fictional example sites shown in "Real examples" on buildwithridge.com.

Each one reuses the design of a real lead demo (palette, fonts, photos, layout) through the
demo builder, but with a made-up business: invented name, 555 phone, generic address, no
Google rating or reviews, and a banner that says the business is made up.

    python3 -I tools/make_examples.py      # run from the buildwithridge folder
writes examples/<slug>/index.html and copies the stock photos next to it.
"""
import copy
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILDER = ROOT.parent / "_builder"
sys.path.insert(0, str(BUILDER))
import build_demo as bd  # noqa: E402


def week(open_, close, closed=()):
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return [f"{d}: Closed" if d in closed else f"{d}: {open_} – {close}" for d in days]


EXAMPLES = {
    "el-girasol-panaderia": {
        "from": "panaderia-mana", "name": "Panadería El Girasol", "town": "San Luis Obispo",
        "address": "100 Main St, San Luis Obispo, CA 93401", "phone": "(805) 555-0101",
        "hours": week("5:00 AM", "7:00 PM"),
        "site": {
            "type_line": "Mexican Bakery", "eyebrow": "Panadería Mexicana · San Luis Obispo",
            "headline": "Pan dulce, fresh every morning",
            "tagline": "Conchas, cuernos, bolillos and homemade tamales, baked before sunrise and open 5 AM to 7 PM every day. Order online and skip the line.",
            "highlights": [
                {"icon": "🌅", "title": "Open early, every day", "text": "5 AM to 7 PM, seven days a week."},
                {"icon": "📱", "title": "Order online", "text": "Order anything in the case, from one concha to tamales by the dozen."},
                {"icon": "🥖", "title": "Baked fresh daily", "text": "Pan dulce, bolillos and traditional Mexican pastries."},
            ],
        },
    },
    "juniper-table-cafe": {
        "from": "crumbles-cafe-bake-shop", "name": "Juniper Table Café", "town": "Arroyo Grande",
        "address": "100 Main St, Arroyo Grande, CA 93420", "phone": "(805) 555-0102",
        "hours": week("7:00 AM", "2:00 PM", closed=("Monday",)),
        "site": {
            "type_line": "Café & Pie Shop", "eyebrow": "Café & Pie Shop · Arroyo Grande",
            "headline": "Homemade pies and hearty breakfasts",
            "tagline": "Fresh-made pies, fluffy omelets and good coffee in the village. Order breakfast, lunch or a whole pie online and skip the wait.",
            "menu_patch": {"California Omelet": "Garden Omelet", "Monte Cristo": "Club Sandwich", "Vegetable Omelet": "Ham & Cheese Omelet"},
        },
    },
    "wren-nail-studio": {
        "from": "olive-nails-spa", "name": "Wren Nail Studio", "town": "Morro Bay",
        "address": "100 Main St, Morro Bay, CA 93442", "phone": "(805) 555-0103",
        "hours": week("10:00 AM", "7:00 PM", closed=("Sunday",)),
        "site": {
            "type_line": "Nail Studio", "eyebrow": "Nail Studio · Morro Bay",
            "headline": "Simple, elegant nails by the bay",
            "tagline": "A clean, calm studio with heated massage chairs and a team that gets your nails just how you imagined. Book your appointment online.",
        },
    },
    "copper-comb-barbershop": {
        "from": "true-blue-barbershop", "name": "Copper Comb Barbershop", "town": "Paso Robles",
        "address": "100 Main St, Paso Robles, CA 93446", "phone": "(805) 555-0104",
        "hours": week("9:00 AM", "6:00 PM", closed=("Monday",)),
        "site": {
            "type_line": "Barbershop", "eyebrow": "Barbershop · Paso Robles",
            "headline": "Sharp cuts, no waiting around",
            "tagline": "Haircuts, fades, beard trims and hot towel shaves just off the square. Walk in, or book your chair online any time.",
            "highlights": [
                {"icon": "💈", "title": "Cuts & beard trims", "text": "Fades, tapers and line-ups, done right."},
                {"icon": "🪒", "title": "Hot towel shaves", "text": "A straight razor finish, the old-school way."},
                {"icon": "📅", "title": "Book online 24/7", "text": "Pick your service and time, and get a text reminder."},
            ],
        },
    },
}


def strip_real_proof(page: str, name: str) -> str:
    page = re.sub(r'<span class="rating-pill"><span class="st">[^<]*</span>[^<]*</span>', "", page)
    page = re.sub(r'\s*<section id="reviews".*?</section>', "", page, flags=re.S)
    page = page.replace('<a href="#reviews">Reviews</a>', "")
    page = re.sub(r'<div class="demo-note">.*?</div>',
                  f'<div class="demo-note">Example site by Ridge. {bd.E(name)} is a made-up business; '
                  f'items tagged “Example” are placeholders.</div>', page, flags=re.S)
    return page


def main():
    for slug, ex in EXAMPLES.items():
        src = ex["from"]
        site = copy.deepcopy(bd.SITES[src])
        site.update({k: v for k, v in ex["site"].items() if k != "menu_patch"})
        site["display_name"] = ex["name"]
        site["town"] = ex["town"]
        site["reviews"] = []
        site["menu_intro"] = "Example items and prices, to show how a full menu looks on the site."
        for group in site.get("menu", []):
            for item in group["items"]:
                item["name"] = ex["site"].get("menu_patch", {}).get(item["name"], item["name"])
                if item["name"] == "Ham & Cheese Omelet":
                    item["desc"] = "Black Forest ham and cheddar"
        lead = {"name": ex["name"], "address": ex["address"], "phone": ex["phone"], "hours": ex["hours"],
                "rating": 5, "reviews_total": 0, "reviews": []}
        bd.SITES[slug] = site
        bd.LEADS[str(site["lead_id"]) + "-" + slug] = lead
        site["lead_id"] = str(site["lead_id"]) + "-" + slug
        bd.PHOTOS[slug] = bd.PHOTOS.get(src, [])
        page = strip_real_proof(bd.build(slug), ex["name"])
        out = ROOT / "examples" / slug
        (out / "images").mkdir(parents=True, exist_ok=True)
        for f in (BUILDER.parent / src / "images").glob("photo-*.jpg"):
            shutil.copy(f, out / "images" / f.name)
        (out / "index.html").write_text(page)
        print("wrote", out / "index.html")


if __name__ == "__main__":
    main()
