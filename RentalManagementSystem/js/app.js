/* Rental Management System — shared front end.
   DEMO=true runs in the browser (localStorage). Set DEMO=false to use backend/api.php + MySQL. */
(() => {
  const DEMO = true,
    ROOT = document.currentScript.src.replace(/js\/app\.js.*/, ""),
    API = ROOT + "backend/api.php";
  const $ = (s, e = document) => e.querySelector(s),
    esc = (v) =>
      String(v ?? "").replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
      );
  const money = (n) => "UGX " + Number(n || 0).toLocaleString(),
    today = () => new Date().toISOString().slice(0, 10);
  /* ---------- data layer ---------- */
  const seed = {
    users: [
      {
        id: 1,
        name: "Landlord",
        email: "admin@rms.ug",
        password: "admin123",
        role: "admin",
      },
    ],
    properties: [
      {
        id: 1,
        name: "Naguru Heights A3",
        room_number: "A3",
        location: "Naguru, Kampala",
        type: "Apartment",
        rooms: 3,
        rent: 1200000,
        status: "available",
        images: "",
        description: "Bright 3-bedroom, parking, 24h water.",
      },
      {
        id: 2,
        name: "Ntinda Single Room",
        room_number: "01",
        location: "Ntinda",
        type: "Single room",
        rooms: 1,
        rent: 250000,
        status: "available",
        images: "",
        description: "Self-contained, tiled, secure gate.",
      },
      {
        id: 3,
        name: "Kira Family House",
        room_number: "01",
        location: "Kira",
        type: "House",
        rooms: 4,
        rent: 1800000,
        status: "occupied",
        images: "",
        description: "Four bedrooms, compound, servant quarter.",
      },
    ],
    tenants: [
      {
        id: 1,
        name: "Aisha Nakato",
        phone: "0772000111",
        email: "aisha@mail.com",
        property_id: 3,
        status: "active",
      },
      {
        id: 2,
        name: "Peter Okello",
        phone: "0701222333",
        email: "peter@mail.com",
        property_id: 2,
        status: "old",
      },
    ],
    leases: [
      {
        id: 1,
        tenant_id: 1,
        property_id: 3,
        start: "2026-01-01",
        end: "2026-12-31",
        rent: 1800000,
        deposit: 1800000,
      },
    ],
    bookings: [],
    payments: [
      {
        id: 1,
        tenant_id: 1,
        property_id: 3,
        tenant_name: "Aisha Nakato",
        amount: 1800000,
        method: "MTN Mobile Money",
        ref: "MM-88231",
        date: "2026-09-01",
        status: "confirmed",
      },
    ],
    bank_accounts: [
      {
        id: 1,
        bank: "Stanbic Bank",
        account_name: "RMS Landlord Ltd",
        account_no: "9030012345678",
        balance: 5200000,
      },
    ],
    mobile_money: [
      {
        id: 1,
        provider: "MTN MoMo",
        number: "0772000999",
        name: "RMS Rentals",
      },
      {
        id: 2,
        provider: "Airtel Money",
        number: "0702000999",
        name: "RMS Rentals",
      },
    ],
    maintenance: [
      {
        id: 1,
        property_id: 3,
        issue: "Leaking kitchen tap",
        status: "open",
        cost: 40000,
      },
    ],
    complaints: [],
  };
  const L = () => {
      if (!localStorage.rms) localStorage.rms = JSON.stringify(seed);
      return JSON.parse(localStorage.rms);
    },
    W = (d) => (localStorage.rms = JSON.stringify(d));
  const me = () => JSON.parse(sessionStorage.u || "null");
  const own = ["bookings", "payments", "complaints"];
  const db = {
    async list(t) {
      if (!DEMO)
        return (
          await fetch(`${API}?a=list&t=${t}`, { credentials: "include" })
        ).json();
      const u = me(),
        r = L()[t] || [];
      return u && u.role === "tenant" && own.includes(t)
        ? r.filter((x) => x.user_id == u.id)
        : r;
    },
    async save(t, row) {
      if (!DEMO)
        return (
          await fetch(`${API}?a=save&t=${t}`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(row),
          })
        ).json();
      const d = L(),
        u = me();
      if (u.role === "tenant") {
        if (!own.includes(t)) return;
        row.user_id = u.id;
        row.tenant_name = u.name;
      }
      if (row.id) {
        d[t] = d[t].map((x) => (x.id == row.id ? { ...x, ...row } : x));
      } else {
        row.id = Date.now();
        (d[t] = d[t] || []).push(row);
      }
      W(d);
      return row;
    },
    async del(t, id) {
      if (!DEMO)
        return fetch(`${API}?a=del&t=${t}&id=${id}`, {
          credentials: "include",
        });
      const d = L();
      d[t] = d[t].filter((x) => x.id != id);
      W(d);
    },
    async login(email, password) {
      if (!DEMO)
        return (
          await fetch(`${API}?a=login`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ email, password }),
          })
        ).json();
      const u = L().users.find(
        (x) => x.email === email && x.password === password,
      );
      return u
        ? { id: u.id, name: u.name, role: u.role }
        : { error: "Wrong email or password." };
    },
    async register(r) {
      if (!DEMO)
        return (
          await fetch(`${API}?a=register`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(r),
          })
        ).json();
      const d = L();
      if (d.users.some((x) => x.email === r.email))
        return { error: "That email already has an account." };
      const id = Date.now();
      d.users.push({
        id,
        name: r.name,
        email: r.email,
        password: r.password,
        role: "tenant",
      }); /* role is always tenant */
      d.tenants.push({
        id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: "active",
        user_id: id,
      });
      W(d);
      return { id, name: r.name, role: "tenant" };
    },
    async logout() {
      sessionStorage.removeItem("u");
      if (!DEMO) await fetch(`${API}?a=logout`, { credentials: "include" });
    },
  };
  /* ---------- images: property URLs first, real Unsplash photos as fallbacks ---------- */
  const stockPhotos = [
    {
      u: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
      n: "Bright living room",
    },
    {
      u: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1000&q=80",
      n: "Comfortable lounge",
    },
    {
      u: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
      n: "Furnished room",
    },
    {
      u: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80",
      n: "Interior details",
    },
  ];
  const imgs = (p) => {
    const custom = (p.images || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((u) => ({ u, n: "Property photo" }));
    if (custom.length) return custom;
    const start = (Number(p.id) || 0) % stockPhotos.length;
    return [...stockPhotos.slice(start), ...stockPhotos.slice(0, start)];
  };
  /* ---------- login page ---------- */
  const page = document.body.dataset.page;
  if (!page) {
    let reg = false;
    const f = $("#f");
    $("#sw").onclick = () => {
      reg = !reg;
      $("#reg").hidden = !reg;
      $("#go").textContent = reg ? "Create tenant account" : "Sign in";
      $("#sw").textContent = reg
        ? "I already have an account"
        : "New tenant? Create account";
      $("#sub").textContent = reg
        ? "Tenant accounts only. Landlord accounts are created by the system owner."
        : "Sign in as landlord or tenant.";
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const r = reg
        ? await db.register({
            name: $("#name").value,
            phone: $("#phone").value,
            email: $("#email").value,
            password: $("#pw").value,
          })
        : await db.login($("#email").value, $("#pw").value);
      if (r.error) return ($("#err").textContent = r.error);
      sessionStorage.u = JSON.stringify(r);
      location.href =
        r.role === "admin" ? "index.html" : "tenant/portal.html";
    };
  }
  /* ---------- admin pages ---------- */
  const NAV = [
    ["dashboard", "Dashboard"],
    ["properties", "Properties"],
    ["tenants", "Tenants"],
    ["leases", "Leases & bookings"],
    ["payments", "Payments"],
    ["bank-accounts", "Bank accounts"],
    ["mobile-money", "Mobile money"],
    ["old-tenants", "Old tenants"],
    ["maintenance", "Maintenance & complaints"],
    ["receipts", "Receipts"],
    ["reports", "Reports"],
  ];
  const st = "available,occupied",
    pay = "MTN Mobile Money,Airtel Money,Bank transfer,Cash";
  const F = {
    properties: {
      t: "properties",
      title: "Properties",
      help: "Create one listing for each separately bookable room. Reuse the building location and give every room its own room number.",
      cols: [
        "name",
        "room_number",
        "location",
        "type",
        "rooms",
        "rent",
        "status",
      ],
      f: [
        ["name", "Name"],
        ["room_number", "Room number", "text", null, true],
        ["location", "Location", "text", null, true],
        ["type", "Type", "select", "House,Apartment,Single room,Shop"],
        ["rooms", "Rooms", "number"],
        ["rent", "Monthly rent (UGX)", "number"],
        ["status", "Status", "select", st],
        ["images", "Image URLs, comma-separated (optional)"],
        ["description", "Description", "textarea"],
      ],
    },
    tenants: {
      t: "tenants",
      title: "Tenants",
      cols: ["name", "phone", "email", "property_id", "status"],
      where: (r) => r.status !== "old",
      def: { status: "active" },
      f: [
        ["name", "Full name"],
        ["phone", "Phone"],
        ["email", "Email"],
        ["property_id", "Room / location", "fk:properties"],
        ["status", "Status", "select", "active,old"],
      ],
    },
    old: {
      t: "tenants",
      title: "Old tenants",
      cols: ["name", "phone", "email", "property_id"],
      where: (r) => r.status === "old",
      def: { status: "old" },
      f: [
        ["name", "Full name"],
        ["phone", "Phone"],
        ["email", "Email"],
        ["property_id", "Last property", "fk:properties"],
        ["status", "Status", "select", "old,active"],
      ],
    },
    leases: {
      t: "leases",
      title: "Leases",
      cols: ["tenant_id", "property_id", "start", "end", "rent", "deposit"],
      f: [
        ["tenant_id", "Tenant", "fk:tenants"],
        ["property_id", "Room / location", "fk:properties"],
        ["start", "Start", "date"],
        ["end", "End", "date"],
        ["rent", "Rent (UGX)", "number"],
        ["deposit", "Deposit (UGX)", "number"],
      ],
    },
    bookings: {
      t: "bookings",
      title: "Room booking requests",
      cols: ["tenant_name", "property_id", "move_in", "status"],
      f: [
        ["property_id", "Room / location", "fk:properties"],
        ["move_in", "Move-in date", "date"],
        ["status", "Status", "select", "pending,approved,rejected"],
      ],
    },
    payments: {
      t: "payments",
      title: "Payments",
      cols: [
        "date",
        "tenant_name",
        "property_id",
        "amount",
        "method",
        "payer_number",
        "ref",
        "status",
      ],
      def: { date: today(), status: "confirmed" },
      f: [
        ["tenant_name", "Tenant name"],
        ["property_id", "Room / location", "fk:properties"],
        ["amount", "Amount (UGX)", "number"],
        ["method", "Method", "select", pay],
        ["payer_number", "Mobile Money number"],
        ["ref", "Reference"],
        ["date", "Date", "date"],
        ["status", "Status", "select", "pending,confirmed,rejected"],
      ],
    },
    banks: {
      t: "bank_accounts",
      title: "Bank accounts",
      cols: ["bank", "account_name", "account_no", "balance"],
      f: [
        ["bank", "Bank"],
        ["account_name", "Account name"],
        ["account_no", "Account number"],
        ["balance", "Balance (UGX)", "number"],
      ],
    },
    momo: {
      t: "mobile_money",
      title: "Mobile money numbers",
      cols: ["provider", "number", "name"],
      f: [
        ["provider", "Provider", "select", "MTN MoMo,Airtel Money"],
        ["number", "Number"],
        ["name", "Registered name"],
      ],
    },
    maint: {
      t: "maintenance",
      title: "Maintenance jobs",
      cols: ["property_id", "issue", "status", "cost"],
      f: [
        ["property_id", "Room / location", "fk:properties"],
        ["issue", "Issue"],
        ["status", "Status", "select", "open,in progress,done"],
        ["cost", "Cost (UGX)", "number"],
      ],
    },
    comp: {
      t: "complaints",
      title: "Tenant complaints",
      cols: ["date", "tenant_name", "subject", "message", "status"],
      f: [
        ["subject", "Subject"],
        ["message", "Message", "textarea"],
        ["status", "Status", "select", "open,resolved"],
      ],
    },
  };
  const PG = {
    properties: ["properties"],
    tenants: ["tenants"],
    leases: ["leases", "bookings"],
    payments: ["payments"],
    "bank-accounts": ["banks"],
    "mobile-money": ["momo"],
    "old-tenants": ["old"],
    maintenance: ["maint", "comp"],
  };
  const label = (c, f) =>
    (f.find((x) => x[0] === c) || [])[1] ||
    c
      .replace(/_id$/, "")
      .replace(/_/g, " ")
      .replace(/^./, (m) => m.toUpperCase());
  let C = {};
  const load = async () => {
    for (const t of [
      "properties",
      "tenants",
      "leases",
      "bookings",
      "payments",
      "bank_accounts",
      "mobile_money",
      "maintenance",
      "complaints",
    ])
      C[t] = await db.list(t);
  };
  const nm = (t, id) => {
    const r = (C[t] || []).find((x) => x.id == id);
    if (!r) return id || "—";
    if (t === "properties")
      return [
        r.name,
        r.room_number ? `Room ${r.room_number}` : "Room number not assigned",
        r.location,
      ]
        .filter(Boolean)
        .join(" · ");
    return r.name;
  };
  const cell = (s, r, c) => {
    const d = s.f.find((x) => x[0] === c),
      v = r[c];
    if (d && d[2] && d[2].startsWith("fk:")) return esc(nm(d[2].slice(3), v));
    if (["rent", "amount", "deposit", "balance", "cost"].includes(c))
      return money(v);
    if (c === "status")
      return `<span class="tag ${/available|active|confirmed|approved|resolved|done/.test(v) ? "good" : /pending|open/.test(v) ? "warn" : ""}">${esc(v)}</span>`;
    return esc(v);
  };
  const field = (d, v) => {
    const [k, l, ty = "text", o, required = false] = d,
      requiredAttr = required ? " required" : "",
      val = esc(v ?? "");
    const inp =
      ty === "textarea"
        ? `<textarea name="${k}" rows="3">${val}</textarea>`
        : ty === "select"
          ? `<select name="${k}">${o
              .split(",")
              .map((x) => `<option ${x == v ? "selected" : ""}>${x}</option>`)
              .join("")}</select>`
          : ty.startsWith("fk:")
            ? `<select name="${k}"${requiredAttr}><option value="">—</option>${(C[ty.slice(3)] || []).map((x) => `<option value="${x.id}" ${x.id == v ? "selected" : ""}>${esc(nm(ty.slice(3), x.id))}</option>`).join("")}</select>`
            : `<input name="${k}" type="${ty}" value="${val}"${requiredAttr}>`;
    return `<label>${l}</label>${inp}`;
  };
  const crud = (key, box) => {
    const s = F[key],
      rows = C[s.t].filter(s.where || (() => 1));
    const h = document.createElement("section");
    h.innerHTML =     `<div class="top"><h2>${s.title}</h2><button class="gold">Add</button></div>${s.help ? `<p class="section-help">${esc(s.help)}</p>` : ""}<div class="wrap"><table><thead><tr>${s.cols.map((c) => `<th>${label(c, s.f)}</th>`).join("")}<th></th></tr></thead><tbody>${rows.map((r) => `<tr>${s.cols.map((c) => `<td>${cell(s, r, c)}</td>`).join("")}<td><button class="alt" data-e="${r.id}">Edit</button> <button class="del" data-d="${r.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="9">Nothing here yet. Use Add to create the first record.</td></tr>`}</tbody></table></div>`;
    const edit = (row) => {
      const dlg = document.createElement("dialog");
      dlg.innerHTML = `<form method="dialog"><h2>${row.id ? "Edit" : "Add"} ${s.title.toLowerCase()}</h2>${s.f.map((d) => field(d, row[d[0]])).join("")}<div class="row"><button class="gold">Save</button><button type="button" class="alt" value="x">Cancel</button></div></form>`;
      document.body.append(dlg);
      dlg.showModal();
      $(".alt", dlg).onclick = () => dlg.remove();
      $("form", dlg).onsubmit = async (e) => {
        e.preventDefault();
        const o = { ...row };
        new FormData(e.target).forEach((v, k) => (o[k] = v));
        await db.save(s.t, o);
        location.reload();
      };
    };
    $(".gold", h).onclick = () => edit({ ...(s.def || {}) });
    h.onclick = async (e) => {
      const b = e.target;
      if (b.dataset.e) edit(rows.find((r) => r.id == b.dataset.e));
      if (b.dataset.d && confirm("Delete this record?")) {
        await db.del(s.t, b.dataset.d);
        location.reload();
      }
    };
    box.append(h);
  };
  const tiles = (a) =>
    `<div class="tiles">${a.map(([n, l]) => `<div class="tile"><b>${n}</b><span>${l}</span></div>`).join("")}</div>`;
  const receipt = (p) => {
    const w = open("", "_blank");
    w.document.write(
      `<title>Receipt ${esc(p.ref || p.id)}</title><body style="font:16px sans-serif;max-width:480px;margin:40px auto"><h2>Rent receipt</h2><p>Receipt no: <b>${esc(p.ref || p.id)}</b><br>Date: ${esc(p.date)}</p><p>Received from <b>${esc(p.tenant_name)}</b><br>Property: ${esc(nm("properties", p.property_id))}</p><h1>${money(p.amount)}</h1><p>Paid by ${esc(p.method)}</p><p>Thank you.</p><script>print()<\/script>`,
    );
  };
  const adminPage = async () => {
    const u = me();
    if (!u || u.role !== "admin") return location.replace("login.html");
    await load();
    document.body.innerHTML = `<nav class="side"><b>Rental Mgmt</b>${NAV.map(([p, l]) => `<a href="${p === "dashboard" ? "index.html" : `${p}.html`}" class="${p === page ? "on" : ""}">${l}</a>`).join("")}<a href="#" id="out">Sign out</a></nav><main></main>`;
    $("#out").onclick = async (e) => {
      e.preventDefault();
      await db.logout();
      location.href = "login.html";
    };
    const m = $("main");
    m.innerHTML = `<h1>${(NAV.find((n) => n[0] === page) || [])[1]}</h1>`;
    const P = C.payments.filter((p) => p.status === "confirmed"),
      sum = (a) => a.reduce((n, x) => n + Number(x.amount || 0), 0);
    if (page === "dashboard") {
      const mo = new Date().toISOString().slice(0, 7);
      m.insertAdjacentHTML(
        "beforeend",
        tiles([
          [C.properties.length, "Properties"],
          [
            C.properties.filter((p) => p.status === "available").length,
            "Vacant",
          ],
          [
            C.tenants.filter((t) => t.status !== "old").length,
            "Active tenants",
          ],
          [
            money(sum(P.filter((p) => p.date.startsWith(mo)))),
            "Collected this month",
          ],
          [
            C.bookings.filter((b) => b.status === "pending").length,
            "Booking requests",
          ],
          [
            C.complaints.filter((c) => c.status !== "resolved").length +
              C.maintenance.filter((x) => x.status !== "done").length,
            "Open issues",
          ],
        ]),
      );
      crud("payments", m);
      crud("bookings", m);
    } else if (page === "receipts") {
      m.insertAdjacentHTML(
        "beforeend",
        `<div class="wrap"><table><tr><th>Receipt</th><th>Date</th><th>Tenant</th><th>Amount</th><th></th></tr>${P.map((p) => `<tr><td>${esc(p.ref || p.id)}</td><td>${esc(p.date)}</td><td>${esc(p.tenant_name)}</td><td>${money(p.amount)}</td><td><button data-r="${p.id}">Print</button></td></tr>`).join("")}</table></div>`,
      );
      m.onclick = (e) => {
        if (e.target.dataset.r)
          receipt(P.find((p) => p.id == e.target.dataset.r));
      };
    } else if (page === "reports") {
      const by = (k) =>
        Object.entries(
          P.reduce(
            (o, p) => ((o[k(p)] = (o[k(p)] || 0) + Number(p.amount)), o),
            {},
          ),
        );
      const tb = (h, r) =>
        `<h2>${h}</h2><div class="wrap"><table>${r.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${money(b)}</td></tr>`).join("") || "<tr><td>No confirmed payments yet.</td></tr>"}</table></div>`;
      m.insertAdjacentHTML(
        "beforeend",
        `<button onclick="print()" class="noprint">Print report</button>` +
          tiles([
            [money(sum(P)), "Total collected"],
            [
              money(C.maintenance.reduce((n, x) => n + Number(x.cost || 0), 0)),
              "Maintenance spend",
            ],
            [
              money(
                C.bank_accounts.reduce((n, x) => n + Number(x.balance || 0), 0),
              ),
              "Bank balances",
            ],
          ]) +
          tb(
            "Collected by month",
            by((p) => p.date.slice(0, 7)),
          ) +
          tb(
            "Collected by property",
            by((p) => nm("properties", p.property_id)),
          ) +
          tb(
            "Collected by method",
            by((p) => p.method),
          ),
      );
    } else (PG[page] || []).forEach((k) => crud(k, m));
  };
  /* ---------- tenant side ---------- */
  const nav = (u) =>
    `<div class="nav"><b>Rental Mgmt</b><span><a href="index.html">Available rooms</a>${u ? '<a href="portal.html">My account</a><a href="#" id="out">Sign out</a>' : '<a href="../login.html">Sign in / Create account</a>'}</span></div>`;
  const lightbox = (src) => {
    let d = $("#lb");
    if (!d) {
      d = document.createElement("dialog");
      d.id = "lb";
      d.onclick = () => d.close();
      document.body.append(d);
    }
    d.innerHTML = `<img src="${src}" alt="Room view">`;
    d.showModal();
  };
  const tenantIndex = async () => {
    const u = me();
    C.properties = await db.list("properties");
    const av = C.properties.filter((p) => p.status === "available");
    document.body.innerHTML =
      nav(u) +
      `<div class="pub"><h1>Available rooms</h1><p style="color:var(--mu)">Each card is one bookable room. Room numbers identify separate units at the same location. Sign in to request a room.</p><div class="grid">${av.map((p) => {
        const hasRoomNumber = Boolean(String(p.room_number || "").trim());
        return `<article class="card"><img src="${imgs(p)[0].u}" alt="${esc(p.name)}" data-v="${p.id}"><div><b>${esc(p.name)}</b><br><span class="room-badge">Room ${esc(p.room_number || "Not assigned")}</span><span class="property-location">${esc(p.location)} · ${p.rooms} room(s) · ${esc(p.type)}</span><p>${esc(p.description)}</p><span class="price">${money(p.rent)}</span> <span class="rent-period">/month</span><div class="row"><button class="alt" data-v="${p.id}">View rooms</button>${hasRoomNumber ? `<button class="gold" data-b="${p.id}">Request room</button>` : `<button class="gold" disabled title="The landlord must assign this room a number first">Room number required</button>`}</div></div></article>`;
      }).join("") || "<p>No houses are available right now. Check back soon.</p>"}</div></div>`;
    if (u)
      $("#out").onclick = async (e) => {
        e.preventDefault();
        await db.logout();
        location.href = "../login.html";
      };
    document.body.onclick = (e) => {
      const v = e.target.dataset.v,
        b = e.target.dataset.b;
      if (v) {
        const p = av.find((x) => x.id == v),
          d = document.createElement("dialog");
        d.style.width = "min(760px,95vw)";
        const hasRoomNumber = Boolean(String(p.room_number || "").trim());
        d.innerHTML = `<h2>${esc(p.name)} — ${money(p.rent)}/month</h2><p><b>Room ${esc(p.room_number || "Not assigned")}</b> · ${esc(p.location)} · ${esc(p.type)}</p><p>${esc(p.description)}</p><div class="gal">${imgs(
          p,
        )
          .map(
            (i) =>
              `<figure style="margin:0"><img src="${i.u}" alt="${esc(i.n)}"><figcaption style="font-size:13px;color:var(--mu)">${esc(i.n)}</figcaption></figure>`,
          )
          .join(
            "",
          )}</div><div class="row">${hasRoomNumber ? `<button class="gold" data-b="${p.id}">Request this room</button>` : `<button class="gold" disabled title="The landlord must assign this room a number first">Room number required</button>`}<button class="alt" id="x">Close</button></div>`;
        document.body.append(d);
        d.showModal();
        $("#x", d).onclick = () => d.remove();
        d.onclick = (ev) => {
          if (ev.target.tagName === "IMG") lightbox(ev.target.src);
          if (ev.target.dataset.b) {
            d.remove();
            book(ev.target.dataset.b);
          }
        };
      }
      if (b) book(b);
    };
    const book = async (id) => {
      if (!me()) return (location.href = "../login.html");
      if (me().role !== "tenant")
        return alert("Sign in with a tenant account to book.");
      const property = av.find((p) => p.id == id);
      if (!property) return alert("This room is no longer available.");
      if (!String(property.room_number || "").trim())
        return alert("The landlord must assign this room a number before it can be requested.");
      const d = document.createElement("dialog");
      d.innerHTML = `<form>
        <h2>Request this room</h2>
        <p><b>${esc(property.name)}</b><br>Room ${esc(property.room_number || "Not assigned")} · ${esc(property.location)}</p>
        <p>${money(property.rent)} / month</p>
        <label for="booking-move-in">Preferred move-in date</label>
        <input id="booking-move-in" name="move_in" type="date" min="${today()}" value="${today()}" required>
        <div class="row"><button class="gold">Send request</button><button type="button" class="alt">Cancel</button></div>
      </form>`;
      document.body.append(d);
      d.showModal();
      $(".alt", d).onclick = () => d.remove();
      $("form", d).onsubmit = async (e) => {
        e.preventDefault();
        const moveIn = new FormData(e.target).get("move_in");
        const saved = await db.save("bookings", {
          property_id: property.id,
          move_in: moveIn,
          status: "pending",
        });
        if (saved?.error) {
          alert(saved.error);
          return;
        }
        d.close();
        d.remove();
        alert(
          "Room request sent to the landlord. You can track its status in My account.",
        );
        location.href = "portal.html";
      };
    };
  };
  const tenantPortal = async () => {
    const u = me();
    if (!u || u.role !== "tenant") return location.replace("../login.html");
    const [pr, bk, py, cm] = await Promise.all(
      ["properties", "bookings", "payments", "complaints"].map((t) =>
        db.list(t),
      ),
    );
    C.properties = pr;
    const tb = (h, c, r) =>
      `<h2>${h}</h2><div class="wrap"><table><tr>${c.map((x) => `<th>${x[1]}</th>`).join("")}</tr>${r.map((x) => `<tr>${c.map((k) => `<td>${k[2] ? k[2](x) : esc(x[k[0]])}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="9">Nothing yet.</td></tr>`}</table></div>`;
    const pn = (x) => esc(nm("properties", x.property_id)),
      sp = (x) => `<span class="tag">${esc(x.status)}</span>`;
    document.body.innerHTML =
      nav(u) +
      `<div class="pub"><h1>Hello, ${esc(u.name)}</h1><div class="row"><button class="gold" id="p">Make a payment</button><button id="c">Send a complaint</button></div>
 ${tb(
   "My bookings",
   [
     ["property_id", "Room / location", pn],
     ["move_in", "Move-in"],
     ["status", "Status", sp],
   ],
   bk,
 )}${tb(
   "My payments",
   [
     ["date", "Date"],
     ["property_id", "Room / location", pn],
     ["amount", "Amount", (x) => money(x.amount)],
     ["method", "Method"],
     ["payer_number", "Mobile Money number"],
     ["ref", "Reference"],
     ["status", "Status", sp],
   ],
   py,
 )}${tb(
   "My complaints",
   [
     ["date", "Date"],
     ["subject", "Subject"],
     ["message", "Message"],
     ["status", "Status", sp],
   ],
   cm,
 )}</div>`;
    $("#out").onclick = async (e) => {
      e.preventDefault();
      await db.logout();
      location.href = "../login.html";
    };
    const ask = (title, fs, fn) => {
      const d = document.createElement("dialog");
      d.innerHTML = `<form method="dialog"><h2>${title}</h2>${fs.map((x) => field(x, "")).join("")}<div class="row"><button class="gold">Send</button><button type="button" class="alt">Cancel</button></div></form>`;
      document.body.append(d);
      d.showModal();
      $(".alt", d).onclick = () => d.remove();
      $("form", d).onsubmit = async (e) => {
        e.preventDefault();
        const o = {};
        new FormData(e.target).forEach((v, k) => (o[k] = v));
        await fn(o);
        location.reload();
      };
    };
    $("#p").onclick = () => {
      const d = document.createElement("dialog");
      d.innerHTML = `<form><h2>Make a payment</h2>
        ${field(["property_id", "Room / location", "fk:properties"], "")}
        <label for="payment-amount">Amount (UGX)</label><input id="payment-amount" name="amount" type="number" min="1" step="1" required>
        <label for="payment-provider">Mobile Money provider</label><select id="payment-provider" name="method" required><option value="MTN Mobile Money">MTN Mobile Money</option><option value="Airtel Money">Airtel Money</option></select>
        <label for="payment-number">Mobile Money number</label><input id="payment-number" name="payer_number" type="tel" autocomplete="tel" placeholder="07XX XXX XXX" required>
        <p>Never enter your Mobile Money PIN in this app. A real payment gateway will ask for it in an official MTN or Airtel prompt.</p>
        <div class="row"><button class="gold">Continue</button><button type="button" class="alt">Cancel</button></div></form>`;
      document.body.append(d);
      $('[name="property_id"]', d).required = true;
      d.showModal();
      $(".alt", d).onclick = () => d.remove();
      $("form", d).onsubmit = async (e) => {
        e.preventDefault();
        const o = Object.fromEntries(new FormData(e.target));
        await db.save("payments", {
          ...o,
          date: today(),
          status: "pending",
        });
        d.close();
        d.remove();
        alert(
          "Payment recorded as pending. No Mobile Money charge was initiated because a payment gateway is not connected.",
        );
        location.reload();
      };
    };
    $("#c").onclick = () =>
      ask(
        "Send a complaint",
        [
          ["subject", "Subject"],
          ["message", "What is the problem?", "textarea"],
        ],
        (o) => db.save("complaints", { ...o, date: today(), status: "open" }),
      );
  };
  (
    ({
      dashboard: adminPage,
      properties: adminPage,
      tenants: adminPage,
      leases: adminPage,
      payments: adminPage,
      "bank-accounts": adminPage,
      "mobile-money": adminPage,
      "old-tenants": adminPage,
      maintenance: adminPage,
      receipts: adminPage,
      reports: adminPage,
      "t-index": tenantIndex,
      "t-portal": tenantPortal,
    })[page] || (() => {})
  )();
})();
