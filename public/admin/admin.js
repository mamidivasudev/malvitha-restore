/* MALVITHA Electronics Restoration: admin (repair requests). Only the admin Google account gets in;
   firestore.rules enforce the same, so this page alone grants nothing. */
(function () {
  "use strict";
  const C = window.MV_CONFIG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const STATUS = [
    ["new", "New"], ["review", "Under Review"], ["possible", "Repair Possible"], ["notpossible", "Repair Not Possible"],
    ["quoted", "Quotation Shared"], ["approved", "Customer Approved"], ["inprogress", "Repair In Progress"], ["completed", "Completed"], ["cancelled", "Cancelled"]
  ];
  const stName = k => (STATUS.find(s => s[0] === k) || [k, k])[1];
  const catName = k => (C.categories.find(c => c[0] === k) || [k, k])[1];
  const when = t => { const d = t && t.toDate ? t.toDate() : null; return d ? d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "just now"; };
  const toast = m => { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 2600); };

  firebase.initializeApp(C.firebase);
  const auth = firebase.auth(), db = firebase.firestore();
  let all = [], stop = null, fStatus = "all";

  // ---------- sign in ----------
  const isAdmin = u => !!(u && u.emailVerified && String(u.email || "").toLowerCase() === C.adminEmail);
  $("#signin").addEventListener("click", async () => {
    $("#login_err").textContent = "";
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    try { await auth.signInWithPopup(p); }
    catch (e) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") return auth.signInWithRedirect(p);
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request")
        $("#login_err").textContent = e.code === "auth/operation-not-allowed" ? "Google sign-in is not switched on for this project yet." : e.code === "auth/unauthorized-domain" ? "This web address is not allowed to sign in yet (add it under Authentication → Settings → Authorized domains)." : "Could not sign in. Please try again.";
    }
  });
  $("#signout").addEventListener("click", () => auth.signOut());
  auth.onAuthStateChanged(async u => {
    if (stop) { stop(); stop = null; }
    if (u && !isAdmin(u)) { await auth.signOut(); $("#login_err").textContent = `${u.email || "This account"} is not allowed. Please use the MALVITHA admin account.`; return; }
    $("#login").hidden = !!u; $("#app").hidden = !u; $("#me").hidden = !u;
    if (!u) return;
    $("#me_email").textContent = u.email;
    // newest 300 requests, kept up to date while the page is open
    stop = db.collection("enquiries").orderBy("created", "desc").limit(300).onSnapshot(s => {
      all = s.docs.map(d => d.data()); draw();
      const open = $("#det").dataset.id; if (open && !$("#ov").hidden) { const r = all.find(x => x.id === open); if (r) fillHead(r); }
    }, e => { $("#list").innerHTML = `<p class="empty">Could not load requests (${esc(e.code || e.message)}).</p>`; });
  });

  // ---------- list ----------
  $("#fcat").insertAdjacentHTML("beforeend", C.categories.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join(""));
  $("#q").addEventListener("input", draw); $("#fcat").addEventListener("change", draw);
  $("#chips").addEventListener("click", e => { const b = e.target.closest("[data-st]"); if (b) { fStatus = b.dataset.st; draw(); } });
  function draw() {
    const n = k => all.filter(r => r.status === k).length;
    $("#chips").innerHTML = [["all", "All", all.length], ...STATUS.map(([k, l]) => [k, l, n(k)])].filter(([k, , c]) => k === "all" || k === "new" || c)
      .map(([k, l, c]) => `<button type="button" role="tab" data-st="${k}" class="chip st-${k}${fStatus === k ? " on" : ""}" aria-selected="${fStatus === k}">${esc(l)} <em>${c}</em></button>`).join("");
    const q = $("#q").value.trim().toLowerCase(), qd = q.replace(/\D/g, ""), cat = $("#fcat").value;
    const rows = all.filter(r => (fStatus === "all" || r.status === fStatus) && (!cat || r.category === cat)
      && (!q || r.id.toLowerCase().includes(q) || String(r.name || "").toLowerCase().includes(q) || (qd.length >= 3 && String(r.phone).includes(qd))));
    $("#count").textContent = `${rows.length} request${rows.length === 1 ? "" : "s"}`;
    $("#list").innerHTML = rows.length ? rows.map(r => `<button type="button" class="row" data-id="${esc(r.id)}">
      <span class="row-t"><b>${esc(r.name)}</b><span class="pill st-${esc(r.status)}">${esc(stName(r.status))}</span></span>
      <span class="row-d">${esc(catName(r.category))} · ${esc(r.device)}</span>
      <span class="row-m"><code>${esc(r.id)}</code><span>${esc(when(r.created))}</span>${r.photos ? `<span>📷 ${r.photos}</span>` : ""}${r.src === "qr" ? `<span class="qr">QR</span>` : ""}</span>
    </button>`).join("") : `<p class="empty">${all.length ? "No requests match." : "No repair requests yet."}</p>`;
  }
  $("#list").addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) openReq(b.dataset.id); });

  // ---------- one request ----------
  const waCustomer = r => `https://wa.me/91${r.phone}?text=${encodeURIComponent(`Hello ${r.name}, this is MALVITHA Electronics Restoration about your repair enquiry ${r.id} (${r.device}).`)}`;
  function fillHead(r) { const p = $("#d_pill"); if (p) { p.className = "pill st-" + r.status; p.textContent = stName(r.status); } }
  async function openReq(id) {
    const r = all.find(x => x.id === id); if (!r) return;
    const d = $("#det"); d.dataset.id = id;
    d.innerHTML = `<div class="det-h"><div><h2 id="d_id">${esc(r.id)}</h2><span class="pill st-${esc(r.status)}" id="d_pill">${esc(stName(r.status))}</span></div><button type="button" class="x" data-close aria-label="Close">×</button></div>
      <div class="det-b">
        <div class="who"><b>${esc(r.name)}</b><a href="tel:+91${esc(r.phone)}">+91 ${esc(r.phone)}</a><small>Prefers ${r.contact === "call" ? "a phone call" : "WhatsApp"} · ${esc(when(r.created))}${r.src === "qr" ? " · from the pamphlet QR" : ""}</small></div>
        <div class="acts"><a class="ab ab-wa" href="${waCustomer(r)}" target="_blank" rel="noopener">WhatsApp</a><a class="ab ab-o" href="tel:+91${esc(r.phone)}">Call</a></div>
        <dl class="facts"><dt>Category</dt><dd>${esc(catName(r.category))}</dd><dt>Device</dt><dd>${esc(r.device)}</dd>${r.brand ? `<dt>Brand / model</dt><dd>${esc(r.brand)}</dd>` : ""}</dl>
        <h3>Problem</h3><p class="prob">${esc(r.problem)}</p>
        <h3>Photos <small>${r.photos || 0}</small></h3><div class="pics" id="d_pics">${r.photos ? Array.from({ length: r.photos }, () => `<span class="pic wait"></span>`).join("") : `<p class="muted">No photos were sent.</p>`}</div>
        <form class="upd" id="d_form">
          <label><span>Status</span><select name="status">${STATUS.map(([k, l]) => `<option value="${k}"${k === r.status ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
          <label><span>Internal notes <small>(only you see these)</small></span><textarea name="notes" rows="4" maxlength="3000" placeholder="e.g. Encoder worn, replace. Quoted ₹150.">${esc(r.notes || "")}</textarea></label>
          <button class="ab ab-y ab-block" type="submit">Save</button>
        </form>
        <button type="button" class="del" id="d_del">Delete this request</button>
      </div>`;
    $("#ov").hidden = false; document.body.classList.add("lock"); d.focus();
    $("#d_form").addEventListener("submit", async e => {
      e.preventDefault(); const f = e.target.elements, btn = e.target.querySelector("button");
      btn.disabled = true; btn.textContent = "Saving…";
      try { await db.collection("enquiries").doc(id).update({ status: f.status.value, notes: f.notes.value.trim(), updated: firebase.firestore.FieldValue.serverTimestamp() }); toast("Saved"); }
      catch (ex) { toast("Could not save: " + (ex.code || ex.message)); }
      finally { btn.disabled = false; btn.textContent = "Save"; }
    });
    $("#d_del").addEventListener("click", async () => {
      if (!confirm(`Delete request ${id} and its photos? This cannot be undone.`)) return;
      try {
        const ps = await db.collection("enquiries").doc(id).collection("photos").get();
        const b = db.batch(); ps.docs.forEach(x => b.delete(x.ref)); b.delete(db.collection("enquiries").doc(id)); await b.commit();
        closeReq(); toast("Request deleted");
      } catch (ex) { toast("Could not delete: " + (ex.code || ex.message)); }
    });
    if (r.photos) {
      try {
        const ps = await db.collection("enquiries").doc(id).collection("photos").orderBy("n").get();
        if ($("#det").dataset.id !== id) return;
        $("#d_pics").innerHTML = ps.docs.length ? ps.docs.map(x => `<button type="button" class="pic" data-full><img src="${x.data().data}" alt="Photo ${x.data().n + 1} of the device"></button>`).join("") + (ps.docs.length < r.photos ? `<p class="muted">${r.photos - ps.docs.length} photo(s) did not upload.</p>` : "") : `<p class="muted">The photos did not upload.</p>`;
      } catch (ex) { $("#d_pics").innerHTML = `<p class="muted">Could not load photos.</p>`; }
    }
  }
  function closeReq() { $("#ov").hidden = true; $("#det").dataset.id = ""; document.body.classList.remove("lock"); }
  $("#ov").addEventListener("click", e => {
    if (e.target.id === "ov" || e.target.closest("[data-close]")) return closeReq();
    const p = e.target.closest("[data-full]"); if (p) { $("#lb_img").src = p.querySelector("img").src; $("#lb").hidden = false; }
  });
  $("#lb").addEventListener("click", () => { $("#lb").hidden = true; });
  document.addEventListener("keydown", e => { if (e.key !== "Escape") return; if (!$("#lb").hidden) $("#lb").hidden = true; else if (!$("#ov").hidden) closeReq(); });
})();
