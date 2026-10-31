(function () {
  var S = window.TechScout;
  var form = document.getElementById("filters");
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  var pager = document.getElementById("pager");
  var info = document.getElementById("pageinfo");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var fields = ["q", "category", "subcategory", "brand", "min_price", "max_price", "min_rating", "min_discount", "sort"];
  var page = 1, pages = 1, ticket = 0, timer = null, categories = [];
  var total = new Intl.NumberFormat("en-IN");

  function option(sel, value, text) {
    var o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    sel.appendChild(o);
  }

  /* sub-category list follows the chosen category */
  function fillSubs(keep) {
    var sel = form.elements.subcategory, cat = form.elements.category.value;
    sel.replaceChildren();
    option(sel, "", "All sub-categories");
    categories.forEach(function (c) {
      if (cat && c.name !== cat) return;
      c.subs.forEach(function (s) { option(sel, s.name, s.name + " (" + total.format(s.count) + ")"); });
    });
    sel.value = keep || "";
  }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    form.elements.category.value = p.get("category") || "";
    fillSubs(p.get("subcategory") || "");
    fields.forEach(function (f) {
      if (f !== "subcategory" && f !== "category" && p.has(f)) form.elements[f].value = p.get(f);
    });
    page = Math.max(1, parseInt(p.get("page"), 10) || 1);
  }

  function params() {
    var p = new URLSearchParams();
    fields.forEach(function (f) {
      var v = form.elements[f].value.trim();
      if (v && !(f === "sort" && v === "popular")) p.set(f, v);
    });
    if (page > 1) p.set("page", page);
    return p;
  }

  function load(push) {
    var p = params();
    var qs = p.toString();
    if (push) history.pushState(null, "", qs ? "?" + qs : location.pathname);
    var mine = ++ticket;
    p.set("sort", form.elements.sort.value);
    fetch("/api/products?" + p.toString())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (mine !== ticket) return;
        page = d.page; pages = d.pages;
        grid.replaceChildren.apply(grid, d.items.map(S.card));
        count.textContent = d.total === 0
          ? "No products match these filters. Clear a filter or change the search words."
          : total.format(d.total) + (d.total === 1 ? " product" : " products");
        pager.hidden = d.pages <= 1;
        info.textContent = "Page " + d.page + " of " + total.format(d.pages);
        prev.disabled = d.page <= 1;
        next.disabled = d.page >= d.pages;
      })
      .catch(function () {
        if (mine !== ticket) return;
        grid.replaceChildren();
        pager.hidden = true;
        count.textContent = "Products could not be loaded. Check that the server is running, then reload the page.";
      });
  }

  function changed() { page = 1; load(true); }
  function init() { readUrl(); load(false); }

  fetch("/api/meta").then(function (r) { return r.json(); }).then(function (m) {
    categories = m.categories;
    categories.forEach(function (c) { option(form.elements.category, c.name, c.name + " (" + total.format(c.count) + ")"); });
    m.brands.forEach(function (b) { option(form.elements.brand, b.name, b.name + " (" + total.format(b.count) + ")"); });
  }).catch(function () {}).then(init);

  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.elements.q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(changed, 250); });
  form.elements.category.addEventListener("change", function () { fillSubs(""); changed(); });
  fields.slice(2).forEach(function (f) { form.elements[f].addEventListener("change", changed); });
  document.getElementById("reset").addEventListener("click", function () {
    fields.forEach(function (f) { form.elements[f].value = f === "sort" ? "popular" : ""; });
    fillSubs("");
    changed();
  });
  function go(n) { page = n; load(true); window.scrollTo(0, 0); }
  prev.addEventListener("click", function () { go(page - 1); });
  next.addEventListener("click", function () { go(page + 1); });
  window.addEventListener("popstate", function () { readUrl(); load(false); });
})();
