(function () {
  var inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat("en-IN");
  var KEY = "techscout.compare", MAX = 4, mem = [], listeners = [], noticeTimer = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function money(v) { return inr.format(v); }
  function ratingLine(item) {
    if (item.rating === null || item.rating === undefined) return "Not rated";
    var s = item.rating.toFixed(1) + " out of 5";
    if (item.rating_count) s += ", " + num.format(item.rating_count) + " ratings";
    return s;
  }
  function image(src, alt, cls) {
    if (!src) return el("div", "noimg " + cls, "No image");
    var img = el("img", cls);
    img.alt = alt;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", function () { img.replaceWith(el("div", "noimg " + cls, "No image")); });
    img.src = src;
    return img;
  }

  /* compare list, kept in this browser only */
  function ids() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(v)) return [];
      return v.filter(function (x) { return typeof x === "string" && /^[A-Za-z0-9]{10}$/.test(x); }).slice(0, MAX);
    } catch (e) { return mem.slice(); }
  }
  function save(list) {
    mem = list.slice();
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    changed();
  }
  function has(id) { return ids().indexOf(id) !== -1; }
  function notice(msg) {
    var n = document.getElementById("notice");
    if (!n) return;
    n.textContent = msg;
    n.hidden = !msg;
    clearTimeout(noticeTimer);
    if (msg) noticeTimer = setTimeout(function () { n.hidden = true; }, 5000);
  }
  function toggle(id) {
    var list = ids();
    var i = list.indexOf(id);
    if (i !== -1) { list.splice(i, 1); save(list); return true; }
    if (list.length >= MAX) {
      notice("You can compare up to " + MAX + " products. Remove one first.");
      return false;
    }
    list.push(id);
    save(list);
    return true;
  }
  function setBtn(b) {
    var on = has(b.getAttribute("data-id"));
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = on ? "Remove from compare" : "Add to compare";
    b.setAttribute("aria-label", (on ? "Remove from compare: " : "Add to compare: ") + b.getAttribute("data-name"));
  }
  function compareButton(id, name) {
    var b = el("button", "btn small cmp");
    b.type = "button";
    b.setAttribute("data-id", id);
    b.setAttribute("data-name", name);
    b.addEventListener("click", function () { toggle(id); });
    setBtn(b);
    return b;
  }
  function changed() {
    var n = ids().length, badge = document.getElementById("compare-count");
    if (badge) { badge.textContent = n; badge.hidden = n === 0; }
    Array.prototype.forEach.call(document.querySelectorAll(".cmp"), setBtn);
    listeners.forEach(function (f) { f(); });
  }
  window.addEventListener("storage", changed);

  function card(item) {
    var li = el("li", "item");
    var a = el("a", "card");
    a.href = "/product/" + encodeURIComponent(item.id);
    var thumb = el("div", "thumb");
    thumb.appendChild(image(item.image, "", "pic"));
    a.appendChild(thumb);
    a.appendChild(el("h3", "name", item.name));
    a.appendChild(el("p", "cat", item.brand + ", " + item.leaf));
    var price = el("p", "price");
    price.appendChild(el("strong", null, money(item.price)));
    if (item.discount > 0) {
      price.appendChild(el("s", null, money(item.mrp)));
      price.appendChild(el("span", "off", item.discount + "% off"));
    }
    a.appendChild(price);
    a.appendChild(el("p", "rating", ratingLine(item)));
    if (item.score !== undefined) a.appendChild(el("p", "rating", "Weighted score " + item.score.toFixed(2)));
    li.appendChild(a);
    li.appendChild(compareButton(item.id, item.name));
    return li;
  }

  /* theme toggle */
  var tbtn = document.getElementById("theme");
  function themeLabel() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    tbtn.textContent = dark ? "Light mode" : "Dark mode";
    tbtn.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " mode");
  }
  if (tbtn) {
    themeLabel();
    tbtn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("techscout.theme", next); } catch (e) {}
      themeLabel();
    });
  }

  window.TechScout = {
    el: el, money: money, num: num, ratingLine: ratingLine, image: image, card: card, notice: notice,
    compare: { ids: ids, has: has, toggle: toggle, clear: function () { save([]); }, button: compareButton },
    onCompare: function (f) { listeners.push(f); }
  };
  changed();
})();
