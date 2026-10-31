(function () {
  var S = window.TechScout;
  var form = document.getElementById("recs-form");
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  var how = document.getElementById("how");
  var ticket = 0;

  fetch("/api/meta").then(function (r) { return r.json(); }).then(function (m) {
    m.categories.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.name; o.textContent = c.name;
      form.elements.category.appendChild(o);
    });
  }).catch(function () {});

  function load() {
    var p = new URLSearchParams();
    ["mode", "category", "max_price"].forEach(function (f) {
      var v = form.elements[f].value.trim();
      if (v) p.set(f, v);
    });
    var mine = ++ticket;
    fetch("/api/recommendations?" + p.toString())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        if (mine !== ticket) return;
        how.textContent = "Products are ranked with a fixed formula, not a trained model. A product's rating is blended with the catalogue average of " +
          d.mean_rating.toFixed(2) + ", and the fewer ratings it has compared with " + S.num.format(d.min_votes) +
          " (the typical count), the more it is pulled toward that average. Discount rankings only include products at or above the average score.";
        grid.replaceChildren.apply(grid, d.items.map(S.card));
        count.textContent = d.items.length === 0
          ? "No products match. Raise the budget or choose another category."
          : "Top " + d.items.length + " of " + S.num.format(d.total) + " matching products";
      })
      .catch(function () {
        if (mine !== ticket) return;
        grid.replaceChildren();
        count.textContent = "Recommendations could not be loaded. Check that the server is running, then reload.";
      });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.elements.mode.addEventListener("change", load);
  form.elements.category.addEventListener("change", load);
  form.elements.max_price.addEventListener("change", load);
  load();
})();
