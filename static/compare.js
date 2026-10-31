(function () {
  var S = window.TechScout;
  var status = document.getElementById("cmp-status");
  var wrap = document.getElementById("cmp-wrap");
  var clear = document.getElementById("cmp-clear");

  function row(label, items, fn, best) {
    var tr = S.el("tr");
    tr.appendChild(Object.assign(S.el("th", null, label), { scope: "row" }));
    items.forEach(function (p) {
      var td = S.el("td");
      var v = fn(p);
      if (v instanceof Node) td.appendChild(v); else td.textContent = v;
      if (best && best(p)) td.appendChild(S.el("span", "best", best.label));
      tr.appendChild(td);
    });
    return tr;
  }
  function pick(items, key, dir) {
    var vals = items.map(function (p) { return p[key]; }).filter(function (v) { return v !== null && v !== undefined; });
    if (items.length < 2 || vals.length < 2) return null;
    var t = dir < 0 ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    if (vals.every(function (v) { return v === t; })) return null;
    var f = function (p) { return p[key] === t; };
    f.label = dir < 0 ? "Lowest" : "Highest";
    return f;
  }

  function render() {
    var list = S.compare.ids();
    if (!list.length) {
      wrap.hidden = true; clear.hidden = true;
      status.textContent = "Nothing to compare yet. Use Add to compare on any product, then return here.";
      return;
    }
    fetch("/api/compare?ids=" + encodeURIComponent(list.join(",")))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var items = d.items;
        status.textContent = items.length === 1
          ? "Add at least one more product to see differences."
          : "Comparing " + items.length + " products. The lowest price and highest rating are marked.";
        var t = S.el("table", "cmp-table");
        t.appendChild(S.el("caption", "sr", "Product comparison"));
        var head = S.el("tr");
        head.appendChild(S.el("td"));
        items.forEach(function (p) {
          var th = Object.assign(S.el("th"), { scope: "col" });
          var thumb = S.el("div", "thumb small-thumb");
          thumb.appendChild(S.image(p.image, "", "pic"));
          th.appendChild(thumb);
          var a = S.el("a", null, p.name);
          a.href = "/product/" + encodeURIComponent(p.id);
          th.appendChild(a);
          head.appendChild(th);
        });
        t.appendChild(S.el("thead")).appendChild(head);
        var b = S.el("tbody");
        b.appendChild(row("Brand", items, function (p) { return p.brand; }));
        b.appendChild(row("Category", items, function (p) { return p.leaf; }));
        b.appendChild(row("Price", items, function (p) { return S.money(p.price); }, pick(items, "price", -1)));
        b.appendChild(row("Original price", items, function (p) { return S.money(p.mrp); }));
        b.appendChild(row("Discount", items, function (p) { return p.discount + "%"; }, pick(items, "discount", 1)));
        b.appendChild(row("Rating", items, function (p) { return p.rating === null ? "Not rated" : p.rating.toFixed(1) + " out of 5"; }, pick(items, "rating", 1)));
        b.appendChild(row("Number of ratings", items, function (p) { return p.rating_count ? S.num.format(p.rating_count) : "Not available"; }));
        b.appendChild(row("Listing", items, function (p) {
          var a = S.el("a", null, "View on amazon.in");
          a.href = p.link; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
          return a;
        }));
        b.appendChild(row("", items, function (p) {
          var btn = S.el("button", "btn small", "Remove");
          btn.type = "button";
          btn.setAttribute("aria-label", "Remove from comparison: " + p.name);
          btn.addEventListener("click", function () { S.compare.toggle(p.id); });
          return btn;
        }));
        t.appendChild(b);
        wrap.replaceChildren(t);
        wrap.hidden = false; clear.hidden = false;
      })
      .catch(function () {
        wrap.hidden = true;
        status.textContent = "The comparison could not be loaded. Check that the server is running, then reload.";
      });
  }
  clear.addEventListener("click", function () { S.compare.clear(); });
  S.onCompare(render);
  render();
})();
