/* MALVITHA Electronics Restoration: the public page (service cards, repair request form, WhatsApp links). */
(function () {
  "use strict";
  const C = window.MV_CONFIG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MAX_PHOTOS = 5, MAX_BYTES = 5 * 1024 * 1024, TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_DATA = 440000; // characters of one shrunk photo (the database keeps each photo in its own record, under 1 MB)

  // ---------- WhatsApp ----------
  const waLink = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
  document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink("Hello MALVITHA, I would like to know if you can repair my device."); });

  // ---------- header menu (phones) ----------
  const burger = $("#burger"), nav = $("#nav");
  const menu = open => { nav.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
  burger.addEventListener("click", () => menu(!nav.classList.contains("open")));
  nav.addEventListener("click", e => { if (e.target.closest("a")) menu(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") menu(false); });

  // ---------- service cards ----------
  $("#svc_g").innerHTML = C.services.map(([cat, ic, title, text, list]) => `<article class="svc-c">
    <span class="svc-ic"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><use href="#${ic}"/></svg></span>
    <h3>${esc(title)}</h3><p>${esc(text)}</p>
    <ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    <a class="btn btn-o btn-sm" href="#request" data-cat="${cat}">Enquire Now</a></article>`).join("");

  // ---------- form ----------
  const form = $("#req_form"), sel = form.elements.category;
  sel.insertAdjacentHTML("beforeend", C.categories.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join(""));
  // "Enquire Now" / "Send a photo" pick the category and bring up the form
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    e.preventDefault();
    sel.value = b.dataset.cat; sel.classList.remove("bad");
    $("#request").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => form.elements.device.focus({ preventScroll: true }), 500);
  });

  // ---------- photos: previews, remove, shrink on the phone ----------
  const photos = []; // { key, url, data } (data = shrunk JPEG as text, or null while preparing)
  const thumbs = $("#thumbs"), pmsg = $("#photo_msg"), input = $("#photos");
  const showThumbs = () => {
    thumbs.innerHTML = photos.map((p, i) => `<li${p.data ? "" : ' class="wait"'}><img src="${p.url}" alt="Photo ${i + 1}"><button type="button" data-rm="${p.key}" aria-label="Remove photo ${i + 1}">×</button>${p.data ? "" : "<span>Preparing…</span>"}</li>`).join("");
    $("#drop").classList.toggle("full", photos.length >= MAX_PHOTOS);
  };
  thumbs.addEventListener("click", e => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    const i = photos.findIndex(p => p.key === b.dataset.rm);
    if (i > -1) { URL.revokeObjectURL(photos[i].url); photos.splice(i, 1); showThumbs(); pmsg.textContent = ""; }
  });
  const loadImg = file => new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("bad")); }; im.src = u; });
  // longest side 1280 px, JPEG; quality and size step down until it fits
  async function shrink(file) {
    const im = await loadImg(file);
    let side = 1280, q = 0.82, out = "";
    for (let tries = 0; tries < 12; tries++) {
      const k = Math.min(1, side / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      out = c.toDataURL("image/jpeg", q);
      if (out.length <= MAX_DATA) return out;
      if (q > 0.55) q -= 0.1; else side = Math.round(side * 0.8);
    }
    throw new Error("too big");
  }
  input.addEventListener("change", async () => {
    const files = [...input.files]; input.value = "";
    const notes = [];
    for (const f of files) {
      if (photos.length >= MAX_PHOTOS) { notes.push(`Only ${MAX_PHOTOS} photos can be added.`); break; }
      if (!TYPES.includes(f.type)) { notes.push(`“${f.name}” is not a JPG, PNG or WEBP photo.`); continue; }
      if (f.size > MAX_BYTES) { notes.push(`“${f.name}” is larger than 5 MB.`); continue; }
      const p = { key: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), data: null };
      photos.push(p); showThumbs();
      try { p.data = await shrink(f); }
      catch (e) { URL.revokeObjectURL(p.url); photos.splice(photos.indexOf(p), 1); notes.push(`“${f.name}” could not be read as a photo.`); }
      showThumbs();
    }
    pmsg.textContent = notes.join(" ");
  });

  // ---------- validation ----------
  const tenDigits = v => { let d = String(v || "").replace(/\D/g, ""); if (d.length === 12 && d.startsWith("91")) d = d.slice(2); if (d.length === 11 && d.startsWith("0")) d = d.slice(1); return d; };
  function check() {
    const f = form.elements, bad = [];
    const mark = (el, ok, msg) => { el.classList.toggle("bad", !ok); if (!ok) bad.push([el, msg]); };
    mark(f.name, f.name.value.trim().length >= 2, "Please enter your name.");
    mark(f.phone, /^[6-9]\d{9}$/.test(tenDigits(f.phone.value)), "Please enter a valid 10-digit mobile number.");
    mark(f.category, !!f.category.value, "Please choose a device category.");
    mark(f.device, f.device.value.trim().length >= 2, "Please enter the device name.");
    mark(f.problem, f.problem.value.trim().length >= 5, "Please describe the problem in a few words.");
    return bad;
  }
  form.addEventListener("input", e => { if (e.target.classList.contains("bad")) check(); });

  // ---------- sending ----------
  const newId = () => { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = new Uint32Array(6); crypto.getRandomValues(r); return `RST-${String(new Date().getFullYear()).slice(-2)}-${Array.from(r, x => A[x % A.length]).join("")}`; };
  const src = new URLSearchParams(location.search).get("src") === "qr" ? "qr" : "direct";
  let db = null;
  const getDb = () => { if (!db) { firebase.initializeApp(C.firebase); db = firebase.firestore(); } return db; };
  const prog = (pct, txt) => { $("#prog").hidden = false; $("#prog_bar").style.width = pct + "%"; $("#prog_txt").textContent = txt; };
  const err = $("#form_err"), btn = $("#submit_btn");

  // the request and today's counter for this phone are written together (the database allows 5 a day per phone)
  async function saveRequest(rec) {
    const d = getDb(), day = Math.floor(Date.now() / 86400000);
    let last;
    for (const dd of [day, day - 1, day + 1]) { // a phone clock a little off around midnight UTC
      const b = d.batch();
      b.set(d.collection("enquiries").doc(rec.id), { ...rec, day: dd, created: firebase.firestore.FieldValue.serverTimestamp() });
      b.set(d.collection("limits").doc(rec.phone + "_" + dd), { n: firebase.firestore.FieldValue.increment(1), last: rec.id }, { merge: true });
      try { await b.commit(); return; } catch (e) { last = e; if (e.code !== "permission-denied") throw e; }
    }
    throw last;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault(); err.textContent = "";
    const bad = check();
    if (bad.length) { err.textContent = bad[0][1]; bad[0][0].focus(); return; }
    if (photos.some(p => !p.data)) { err.textContent = "Please wait a moment — your photos are still being prepared."; return; }
    const f = form.elements, id = newId(), list = photos.map(p => p.data);
    const rec = { id, name: f.name.value.trim(), phone: tenDigits(f.phone.value), category: f.category.value, device: f.device.value.trim(), brand: f.brand.value.trim(), problem: f.problem.value.trim(), contact: f.contact.value, src, photos: list.length, status: "new", notes: "" };
    btn.disabled = true; btn.textContent = "Sending…";
    let missed = 0;
    try {
      if (f.website.value) { await new Promise(r => setTimeout(r, 900)); } // a spam bot filled the hidden field: pretend it worked
      else {
        prog(10, "Sending your request…");
        await saveRequest(rec);
        for (let i = 0; i < list.length; i++) {
          prog(15 + Math.round(85 * i / list.length), `Uploading photo ${i + 1} of ${list.length}…`);
          try { await getDb().collection("enquiries").doc(id).collection("photos").doc(String(i)).set({ n: i, data: list[i] }); }
          catch (pe) { missed++; }
        }
        prog(100, "Done");
      }
      success(id, missed);
    } catch (ex) {
      $("#prog").hidden = true;
      err.innerHTML = ex && ex.code === "permission-denied"
        ? `We couldn't send this request. If you have already sent several requests today, please <a href="${waLink("Hello MALVITHA, I would like to send a repair request.")}" target="_blank" rel="noopener">message us on WhatsApp</a>.`
        : `We couldn't send your request. Please check your internet connection and try again, or <a href="${waLink("Hello MALVITHA, I would like to send a repair request.")}" target="_blank" rel="noopener">message us on WhatsApp</a>.`;
    } finally { btn.disabled = false; btn.textContent = "Submit Repair Request"; }
  });

  function success(id, missed) {
    form.hidden = true; $("#prog").hidden = true;
    const d = $("#done"); d.hidden = false;
    $("#done_id").textContent = id;
    $("#done_wa").href = waLink(`Hello MALVITHA, I have submitted a repair enquiry.\nMy Enquiry ID is: ${id}\nPlease review my request.`);
    if (missed) d.querySelector("p").insertAdjacentHTML("afterend", `<p class="warn">${missed} photo${missed > 1 ? "s" : ""} could not be uploaded. Please send ${missed > 1 ? "them" : "it"} to us on WhatsApp with your Enquiry ID.</p>`);
    d.scrollIntoView({ behavior: "smooth", block: "start" }); d.focus({ preventScroll: true });
  }
  // "Back to Home": an empty form again, for another device
  $("#done_home").addEventListener("click", () => {
    form.reset(); photos.splice(0).forEach(p => URL.revokeObjectURL(p.url)); showThumbs(); pmsg.textContent = ""; err.textContent = "";
    const w = $("#done .warn"); if (w) w.remove();
    $("#done").hidden = true; form.hidden = false;
  });

  $("#yr").textContent = new Date().getFullYear();
})();
