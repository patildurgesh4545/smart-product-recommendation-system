(function () {
  var S = window.TechScout;
  var root = document.getElementById("product");
  var id = root.getAttribute("data-id");

  function show(p) {
    document.title = p.name + " | TechScout";
    var wrap = S.el("div", "detail");
    var pic = S.el("div", "detail-pic");
    pic.appendChild(S.image(p.image, p.name, "pic"));
    wrap.appendChild(pic);

    var body = S.el("div", "detail-body");
    body.appendChild(S.el("p", "muted", p.brand + ", " + p.categories.join(" / ")));
    body.appendChild(S.el("h1", "detail-name", p.name));
    body.appendChild(S.el("p", "rating", S.ratingLine(p)));

    var price = S.el("p", "price big");
    price.appendChild(S.el("strong", null, S.money(p.price)));
    if (p.discount > 0) {
      price.appendChild(S.el("s", null, S.money(p.mrp)));
      price.appendChild(S.el("span", "off", p.discount + "% off"));
    }
    body.appendChild(price);
    body.appendChild(S.el("p", "muted", "Price and rating are from the dataset snapshot and may have changed."));

    var actions = S.el("div", "row left");
    var a = S.el("a", "btn primary", "View on amazon.in");
    a.href = p.link;
    a.rel = "noopener noreferrer nofollow";
    a.target = "_blank";
    actions.appendChild(a);
    actions.appendChild(S.compare.button(p.id, p.name));
    body.appendChild(actions);

    if (p.about.length) {
      body.appendChild(S.el("h2", null, "About this item"));
      var ul = S.el("ul", "about");
      p.about.forEach(function (t) { ul.appendChild(S.el("li", null, t)); });
      body.appendChild(ul);
    }
    wrap.appendChild(body);
    root.replaceChildren(wrap);

    if (p.similar.length) {
      var sim = document.getElementById("similar");
      sim.replaceChildren.apply(sim, p.similar.map(S.card));
      document.getElementById("similar-wrap").hidden = false;
    }
  }

  fetch("/api/products/" + encodeURIComponent(id))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(show)
    .catch(function () {
      root.replaceChildren(S.el("p", null, "This product could not be loaded. Return to the list and try again."));
    });
})();
