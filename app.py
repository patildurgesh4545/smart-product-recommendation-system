import csv
import os
import re
import statistics
import sys
from collections import Counter
from pathlib import Path
from flask import Flask, jsonify, render_template, request

BASE = Path(__file__).resolve().parent
DATA_FILE = Path(os.environ.get("DATA_FILE", BASE / "data" / "amazon.csv"))
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "khelwadeom@gmail.com").strip()
CONTACT_PHONE = os.environ.get("CONTACT_PHONE", "+91 9529392363").strip()
LAST_UPDATED = "25 October 2026"
MAX_COMPARE = 4
REQUIRED = {"product_id", "product_name", "category", "discounted_price", "actual_price",
            "rating", "rating_count", "about_product", "img_link"}

EMOJI = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200d]")
IMG_RE = re.compile(r"^https://[A-Za-z0-9.-]*media-amazon\.com/[^\s\"'<>]+$")
ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")
STOP = {"with", "for", "and", "the", "of", "in", "to", "pack", "black", "white", "blue", "inch", "inches", "cm"}


def clean_text(value):
    text = EMOJI.sub("", value or "")
    text = text.replace("\u2014", " - ").replace("\u2013", "-")
    return re.sub(r"\s+", " ", text).strip()


def pretty_category(segment):
    """'HomeTheater,TV&Video' becomes 'Home Theater, TV & Video'."""
    s = segment.replace("&", " & ").replace(",", ", ")
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s)
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_money(value):
    """'\u20b91,099' becomes 1099.0."""
    digits = re.sub(r"[^\d.]", "", value or "")
    try:
        return float(digits)
    except ValueError:
        return None


def parse_count(value):
    """'24,269' becomes 24269. Blank values stay missing."""
    try:
        n = int(float((value or "").replace(",", "").strip()))
    except ValueError:
        return None
    return n if n >= 0 else None


def parse_rating(value):
    """The file has one row where the rating is '|'. It stays missing, it is not guessed."""
    try:
        r = float((value or "").strip())
    except ValueError:
        return None
    return r if 0 <= r <= 5 else None


def brand_of(name):
    """The file has no brand column, so the brand is the leading word of the product name."""
    n = re.sub(r"^\W+", "", name)
    if re.match(r"(?i)amazon\s*basics", n):
        return "AmazonBasics"
    m = re.match(r"(?i)amazon\s*brand\s*[-:]\s*(\S+)", n)
    tok = m.group(1) if m else (n.split(" ")[0] if n else "")
    tok = re.sub(r"[\u00ae\u2122,:;()\[\]]", "", tok).strip()
    return tok or "Other"


def load_products(path):
    if not path.is_file():
        sys.exit(f"Dataset not found at {path}. Put amazon.csv in the data folder or set DATA_FILE.")
    csv.field_size_limit(10**7)
    products, seen, skipped, repeats = [], set(), 0, 0
    with path.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            sys.exit("This file does not look like amazon.csv. Missing columns: " + ", ".join(sorted(missing)))
        for row in reader:
            pid = (row.get("product_id") or "").strip()
            name = clean_text(row.get("product_name"))
            price = parse_money(row.get("discounted_price"))
            if not ASIN_RE.match(pid) or not name or price is None:
                skipped += 1
                continue
            if pid in seen:
                repeats += 1  # the file lists some products more than once; the first copy is kept
                continue
            seen.add(pid)
            mrp = parse_money(row.get("actual_price"))
            if not mrp or mrp < price:
                mrp = price
            cats = [pretty_category(c) for c in (row.get("category") or "").split("|") if c.strip()]
            img = (row.get("img_link") or "").strip()
            products.append({
                "id": pid, "name": name, "brand": brand_of(name), "categories": cats,
                "top": cats[0] if cats else "Uncategorised",
                "sub": cats[1] if len(cats) > 1 else None,
                "leaf": cats[-1] if cats else "Uncategorised",
                "price": price, "mrp": mrp,
                "discount": round((mrp - price) / mrp * 100) if mrp else 0,
                "rating": parse_rating(row.get("rating")),
                "rating_count": parse_count(row.get("rating_count")),
                "about": [b for b in (clean_text(x) for x in (row.get("about_product") or "").split("|")) if b],
                "image": img if IMG_RE.match(img) else None,
                "link": f"https://www.amazon.in/dp/{pid}",
            })
    if not products:
        sys.exit("No usable rows found in the dataset.")
    # One spelling per brand (most common), grouped case-insensitively.
    spell = {}
    for p in products:
        spell.setdefault(p["brand"].lower(), Counter())[p["brand"]] += 1
    for p in products:
        key = p["brand"].lower()
        p["brand"], p["_bk"] = spell[key].most_common(1)[0][0], key
        p["_hay"] = (p["name"] + " " + " ".join(p["categories"])).lower()
        p["_tok"] = {t for t in re.findall(r"[a-z0-9]+", p["name"].lower()) if len(t) > 1 and t not in STOP}
    # Weighted rating: pulls ratings with few votes toward the catalogue mean (a fixed formula, not a trained model).
    rated = [p for p in products if p["rating"] is not None and p["rating_count"]]
    mean = sum(p["rating"] for p in rated) / len(rated)
    votes = int(statistics.median(p["rating_count"] for p in rated))
    for p in products:
        v, r = p["rating_count"], p["rating"]
        p["_w"] = (v / (v + votes) * r + votes / (v + votes) * mean) if (r is not None and v) else None
    print(f"Loaded {len(products)} products ({repeats} repeated listings merged, {skipped} rows skipped).")
    return products, mean, votes


app = Flask(__name__, static_folder="static", static_url_path="/static")
PRODUCTS, MEAN_RATING, MIN_VOTES = load_products(DATA_FILE)
BY_ID = {p["id"]: p for p in PRODUCTS}
BY_TOP = {}
for _p in PRODUCTS:
    BY_TOP.setdefault(_p["top"], []).append(_p)


def build_meta():
    tops = {}
    for p in PRODUCTS:
        t = tops.setdefault(p["top"], {"count": 0, "subs": Counter()})
        t["count"] += 1
        if p["sub"]:
            t["subs"][p["sub"]] += 1
    brands = Counter(p["brand"] for p in PRODUCTS)
    return {
        "total": len(PRODUCTS),
        "categories": [{"name": n, "count": t["count"],
                        "subs": [{"name": s, "count": c} for s, c in sorted(t["subs"].items())]}
                       for n, t in sorted(tops.items())],
        "brands": [{"name": n, "count": c} for n, c in sorted(brands.items(), key=lambda x: x[0].lower()) if c >= 5],
        "price_min": min(p["price"] for p in PRODUCTS),
        "price_max": max(p["price"] for p in PRODUCTS),
        "max_compare": MAX_COMPARE,
    }


META = build_meta()
CARD_KEYS = ("id", "name", "brand", "leaf", "top", "sub", "price", "mrp", "discount", "rating", "rating_count", "image")


def card(p, score=False):
    out = {k: p[k] for k in CARD_KEYS}
    if score and p["_w"] is not None:
        out["score"] = round(p["_w"], 2)
    return out


def public(p):
    return {k: v for k, v in p.items() if not k.startswith("_")}


def num_arg(name, cast):
    try:
        return cast(request.args.get(name, ""))
    except (TypeError, ValueError):
        return None


def price_ok(p, lo, hi):
    return (lo is None or p["price"] >= lo) and (hi is None or p["price"] <= hi)


SORTS = {
    "popular": lambda p: (-(p["rating_count"] or -1), p["name"]),
    "rating": lambda p: (-(p["rating"] if p["rating"] is not None else -1), -(p["rating_count"] or -1), p["name"]),
    "price_asc": lambda p: (p["price"], p["name"]),
    "price_desc": lambda p: (-p["price"], p["name"]),
    "discount": lambda p: (-p["discount"], p["name"]),
}


@app.after_request
def headers(resp):
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' https://*.media-amazon.com; "
        "base-uri 'self'; form-action 'self'; frame-ancestors 'none'")
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "no-referrer"
    return resp


@app.context_processor
def site_context():
    return {"market": "amazon.in", "region": "Amazon India", "currency": "INR",
            "ds_name": "Amazon Sales Dataset",
            "ds_url": "https://www.kaggle.com/datasets/karkavelrajaj/amazon-sales-dataset",
            "ds_license": "CC BY-NC-SA 4.0 (attribution, non-commercial, share-alike)"}


@app.get("/api/meta")
def meta():
    return jsonify(META)


@app.get("/api/products")
def products():
    q = request.args.get("q", "").strip().lower()[:100]
    category = request.args.get("category", "").strip()
    sub = request.args.get("subcategory", "").strip()
    brand = request.args.get("brand", "").strip().lower()
    min_price, max_price = num_arg("min_price", float), num_arg("max_price", float)
    min_rating, min_discount = num_arg("min_rating", float), num_arg("min_discount", float)
    sort = request.args.get("sort", "popular")
    sort = sort if sort in SORTS else "popular"
    page = max(1, num_arg("page", int) or 1)
    per_page = min(48, max(1, num_arg("per_page", int) or 24))
    terms = q.split()
    items = [p for p in PRODUCTS
             if all(t in p["_hay"] for t in terms)
             and (not category or p["top"] == category)
             and (not sub or p["sub"] == sub)
             and (not brand or p["_bk"] == brand)
             and price_ok(p, min_price, max_price)
             and (min_discount is None or p["discount"] >= min_discount)
             and (min_rating is None or (p["rating"] is not None and p["rating"] >= min_rating))]
    items.sort(key=SORTS[sort])
    total = len(items)
    pages = max(1, -(-total // per_page))
    page = min(page, pages)
    start = (page - 1) * per_page
    return jsonify({"total": total, "page": page, "pages": pages,
                    "items": [card(p) for p in items[start:start + per_page]]})


@app.get("/api/products/<pid>")
def product(pid):
    p = BY_ID.get(pid)
    if not p:
        return jsonify({"error": "Product not found"}), 404
    scored = []
    for x in BY_TOP[p["top"]]:
        if x is p:
            continue
        union = len(p["_tok"] | x["_tok"]) or 1
        s = (2 if x["leaf"] == p["leaf"] else 0) + len(p["_tok"] & x["_tok"]) / union
        if s > 0:
            scored.append((-s, -(x["_w"] or 0), x["name"], x))
    scored.sort(key=lambda t: t[:3])
    detail = public(p)
    detail["similar"] = [card(t[3]) for t in scored[:4]]
    return jsonify(detail)


@app.get("/api/compare")
def compare():
    ids = []
    for pid in request.args.get("ids", "").split(","):
        pid = pid.strip()
        if pid in BY_ID and pid not in ids:
            ids.append(pid)
    items = []
    for pid in ids[:MAX_COMPARE]:
        d = public(BY_ID[pid])
        d.pop("about", None)
        items.append(d)
    return jsonify({"items": items})


@app.get("/api/recommendations")
def recommendations():
    category = request.args.get("category", "").strip()
    max_price = num_arg("max_price", float)
    mode = "deals" if request.args.get("mode") == "deals" else "quality"
    limit = min(24, max(1, num_arg("limit", int) or 12))
    items = [p for p in PRODUCTS if p["_w"] is not None and (not category or p["top"] == category)
             and price_ok(p, None, max_price)]
    if mode == "deals":
        items = [p for p in items if p["_w"] >= MEAN_RATING and p["discount"] > 0]
        items.sort(key=lambda p: (-p["discount"], -p["_w"], p["name"]))
    else:
        items.sort(key=lambda p: (-p["_w"], p["name"]))
    return jsonify({"mode": mode, "mean_rating": round(MEAN_RATING, 2), "min_votes": MIN_VOTES,
                    "total": len(items), "items": [card(p, score=True) for p in items[:limit]]})


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/search")
def search():
    return render_template("search.html")


@app.get("/compare")
def compare_page():
    return render_template("compare.html")


@app.get("/recommendations")
def recommendations_page():
    return render_template("recommendations.html")


@app.get("/product/<pid>")
def product_page(pid):
    if pid not in BY_ID:
        return render_template("404.html"), 404
    return render_template("product.html", pid=pid)


@app.get("/privacy")
def privacy():
    return render_template("privacy.html", contact=CONTACT_EMAIL, updated=LAST_UPDATED)


@app.get("/terms")
def terms():
    return render_template("terms.html", contact=CONTACT_EMAIL, updated=LAST_UPDATED)


@app.errorhandler(404)
def not_found(_):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Not found"}), 404
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", 5000)))
