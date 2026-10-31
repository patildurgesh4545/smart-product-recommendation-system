(function () {
  var S = window.TechScout;
  var form = document.getElementById("home-form");
  function fill(sel, rows) {
    rows.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r.name;
      o.textContent = r.name + " (" + S.num.format(r.count) + ")";
      sel.appendChild(o);
    });
  }
  fetch("/api/meta").then(function (r) { return r.json(); }).then(function (m) {
    fill(form.elements.category, m.categories);
    fill(form.elements.brand, m.brands);
    var subs = [];
    m.categories.forEach(function (c) {
      c.subs.forEach(function (s) { subs.push({ top: c.name, name: s.name, count: s.count }); });
    });
    subs.sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
    var tiles = document.getElementById("tiles");
    subs.forEach(function (s) {
      var li = S.el("li");
      var a = S.el("a", "tile");
      a.href = "/search?category=" + encodeURIComponent(s.top) + "&subcategory=" + encodeURIComponent(s.name);
      a.appendChild(S.el("span", "tile-name", s.name));
      a.appendChild(S.el("span", "tile-count", S.num.format(s.count) + (s.count === 1 ? " product" : " products") + " in " + s.top));
      li.appendChild(a);
      tiles.appendChild(li);
    });
  }).catch(function () {});
  fetch("/api/products?per_page=10").then(function (r) { return r.json(); }).then(function (d) {
    var g = document.getElementById("grid");
    g.replaceChildren.apply(g, d.items.map(S.card));
  }).catch(function () {});
})();
