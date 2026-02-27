(function () {
  const statusText = document.getElementById("statusText");
  const logBox     = document.getElementById("logBox");
  const container  = document.getElementById("labels-container");
  const btnLoad    = document.getElementById("btnLoad");
  const btnPrint   = document.getElementById("btnPrint");
  const chkAutoPrint = document.getElementById("chkAutoPrint");

  const REPORT_NAME = "All_Label_Print_Queues";

  const CHAR_THRESHOLD = 15;   
  const FONT_SHORT     = 32;   
  const FONT_LONG      = 20;   

  let LOGO_URL = "";
  try {
    LOGO_URL = ZOHO.CREATOR.UTIL.getResourceUrl("glenvex.png");
  } catch (e) {
    LOGO_URL = "./glenvex.png";
  }

  function log(msg, obj) {
    let line = `[${new Date().toISOString()}] ${msg}`;
    if (obj !== undefined) {
      try { line += " | " + JSON.stringify(obj).slice(0, 2000); } catch (e) {}
    }
    console.log(line);
    logBox.textContent += line + "\n";
    logBox.scrollTop = logBox.scrollHeight;
  }

  function setStatus(t) {
    statusText.innerText = t;
    log("STATUS: " + t);
  }

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function displayVal(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") {
      if (v.display_value !== undefined) return v.display_value;
      if (v.value         !== undefined) return v.value;
      return JSON.stringify(v);
    }
    return String(v);
  }

  function field(rec, key) {
    return displayVal(rec && rec[key] !== undefined ? rec[key] : "");
  }

  function itemStyle(text) {
    if (text.length <= CHAR_THRESHOLD) {
      return { fontSize: FONT_SHORT, lineClamp: 1 };
    }
    return { fontSize: FONT_LONG, lineClamp: 2 };
  }

  btnPrint.addEventListener("click", () => { log("Manual print"); window.print(); });
  btnLoad.addEventListener("click",  () => { log("Reload"); loadAndRender(); });

  async function getSessionId() {
    try {
      const qp = await ZOHO.CREATOR.UTIL.getQueryParams();
      return (qp && qp.session_id) ? String(qp.session_id) : "";
    } catch (e) {
      log("WARN getQueryParams failed", String(e));
      return "";
    }
  }

  async function fetchAll(criteria) {
    let all = [], cursor = null;
    while (true) {
      const cfg = { report_name: REPORT_NAME, max_records: 1000 };
      if (criteria) cfg.criteria   = criteria;
      if (cursor)   cfg.record_cursor = cursor;
      log("DATA.getRecords", cfg);
      const resp = await ZOHO.CREATOR.DATA.getRecords(cfg);
      if (!resp || resp.code !== 3000) {
        throw new Error("getRecords failed. code=" + (resp ? resp.code : "null"));
      }
      all    = all.concat(resp.data || []);
      cursor = resp.record_cursor || (resp.info && resp.info.record_cursor) || null;
      if (!cursor) break;
    }
    return all;
  }

  function render(records) {
    let html = "";
    for (let i = 0; i < records.length; i++) {
      const r      = records[i];
      const hotel  = field(r, "Hotel_Name");
      const datev  = field(r, "Date_field");
      const bill   = field(r, "Label_BillNoFinal");
      const remark = field(r, "Label_RemarkFinal");
      const idx    = field(r, "Label_IndexText");
      const item   = field(r, "Label_ItemFinal");
      const qty    = field(r, "Label_PackQty");

      const { fontSize, lineClamp } = itemStyle(item);

      html += `
      <div class="label">
        <div class="logoBox">
          <img src="${esc(LOGO_URL)}" alt="logo" onerror="this.style.display='none'" />
        </div>

        <div class="hotel-name">${esc(hotel)}</div>

        <div class="info">
          <div>Date</div><div class="c">:</div><div>${esc(datev)}</div>
          <div>Bill No</div><div class="c">:</div><div>${esc(bill)}</div>
          <div>Remark</div><div class="c">:</div><div>${esc(remark)}</div>
        </div>

        <div class="mid-section">
          <div class="index-row">${esc(idx)}</div>
          <div class="divider"></div>
        </div>

        <div class="bottom-area">
          <div class="item-name" style="font-size:${fontSize}pt; -webkit-line-clamp:${lineClamp};">${esc(item)}</div>
          <div class="qty">${esc(qty)}</div>
        </div>
      </div>`;
    }
    container.innerHTML = html;
  }

  function preloadImage(url) {
    return new Promise((resolve) => {
      if (!url) { resolve(); return; }
      const img = new Image();
      img.onload  = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  async function loadAndRender() {
    try {
      logBox.textContent = "";
      if (!window.ZOHO || !ZOHO.CREATOR || !ZOHO.CREATOR.DATA) {
        setStatus("ERROR: Widget SDK not available.");
        return;
      }

      setStatus("Reading session_id…");
      const sessionId = await getSessionId();
      const criteria = sessionId ? `(Session_ID == "${sessionId}")` : "";

      setStatus("Loading…");
      const [records] = await Promise.all([
        fetchAll(criteria),
        preloadImage(LOGO_URL)
      ]);

      if (!records.length) {
        setStatus("No records found.");
        container.innerHTML = "";
        return;
      }

      setStatus(`Rendering ${records.length} label(s)…`);
      render(records);
      setStatus(`Rendered ${records.length} label(s).`);

      window.onafterprint = function () {
        window.top.location.href = "https://creatorapp.zoho.com/kelvinkhoo_glenvex/laundry-operation-system/#Form:Print_Labels1";
      };

      if (chkAutoPrint.checked) {
        setTimeout(() => window.print(), 1200);
      }

    } catch (e) {
      log("ERROR", String(e));
      setStatus("Failed. See logs.");
    }
  }

  loadAndRender();
})();

// (function () {
//   "use strict";

//   // ─── CONFIG ──────────────────────────────────────────────────────────────────
//   const APP_LINK_NAME = "laundry-operation-system";

//   // These can be DISPLAY names OR link names. Script will auto-resolve.
//   const PRICE_LIST_REPORT_HINT = "All_Price_Lists_Admin";
//   const QUEUE_FORM_HINT        = "Label_Print_Queue";

//   const OWNER      = "kelvinkhoo_glenvex";
//   const PRINT_PAGE = "Label_Print_Page";

//   const MAX_LABEL_SLOTS = 100;

//   // ─── DOM REFS ────────────────────────────────────────────────────────────────
//   const $ = (id) => document.getElementById(id);

//   const elHotel       = $("Hotel_Name");
//   const elLaundryType = $("Laundry_Type");
//   const elLaundryItem = $("Laundry_Item");
//   const elWashType    = $("Wash_Type");
//   const elServiceType = $("Service_Type");
//   const elOrderNo     = $("Order_Number");
//   const elDate        = $("Date_field");
//   const elPackSize    = $("Pack_Size");
//   const elClean       = $("Clean_Total");
//   const elStain       = $("Stain_Total");
//   const elTorn        = $("Torn_Total");
//   const elRemark      = $("Remark");
//   const elGroupRemark = $("group-Remark");
//   const elBtnPrint    = $("btnPrint");
//   const elBtnReset    = $("btnReset");
//   const elStatusBadge = $("statusBadge");
//   const elLoader      = $("loaderWrap");
//   const elLoaderText  = $("loaderText");
//   const elToastCon    = $("toastContainer");

//   // sanity check
//   [
//     elHotel, elLaundryType, elLaundryItem, elWashType, elServiceType, elOrderNo, elDate,
//     elPackSize, elClean, elStain, elTorn, elRemark, elGroupRemark, elBtnPrint, elBtnReset,
//     elStatusBadge, elLoader, elLoaderText, elToastCon
//   ].forEach((x, i) => { if (!x) throw new Error("Missing DOM element at index " + i); });

//   let allPriceRecords = [];

//   // resolved link names (filled during init)
//   let PRICE_LIST_REPORT_LINK = null;
//   let QUEUE_FORM_LINK        = null;

//   // ─── UI HELPERS ─────────────────────────────────────────────────────────────
//   function setStatus(text, type) {
//     elStatusBadge.textContent = text;
//     elStatusBadge.className = "status-badge" + (type ? " " + type : "");
//   }

//   function showLoader(text) {
//     elLoaderText.textContent = text || "Loading…";
//     elLoader.classList.add("active");
//   }

//   function hideLoader() {
//     elLoader.classList.remove("active");
//   }

//   function toast(msg, type, duration) {
//     const el = document.createElement("div");
//     el.className = "toast " + (type || "info");
//     el.textContent = msg;
//     elToastCon.appendChild(el);
//     setTimeout(function () {
//       if (el.parentNode) el.parentNode.removeChild(el);
//     }, duration || 4000);
//   }

//   function setSelectOptions(selectEl, options) {
//     const first = selectEl.options[0];
//     selectEl.innerHTML = "";
//     if (first) selectEl.appendChild(first);
//     options.forEach(function (val) {
//       const o = document.createElement("option");
//       o.value = o.textContent = val;
//       selectEl.appendChild(o);
//     });
//   }

//   function getInt(el) {
//     const v = parseInt((el.value || "").trim(), 10);
//     return isNaN(v) ? 0 : v;
//   }

//   function markValid(groupId)  { const e = $(groupId); if (e) e.classList.remove("has-error"); }
//   function markError(groupId)  { const e = $(groupId); if (e) e.classList.add("has-error"); }

//   function fieldVal(rec, key) {
//     const v = rec[key];
//     if (v === null || v === undefined) return "";

//     // Lookup fields often come back as an object like:
//     // { ID: "...", zc_display_value: "citizenM KL", ... }
//     if (typeof v === "object") {
//       if (v.zc_display_value !== undefined) return String(v.zc_display_value);
//       if (v.display_value    !== undefined) return String(v.display_value);
//       if (v.name             !== undefined) return String(v.name);
//       if (v.Name             !== undefined) return String(v.Name);
//       if (v.value            !== undefined) return String(v.value);

//       // Sometimes the lookup object also contains a string field with the same name
//       if (v[key] !== undefined && typeof v[key] !== "object") return String(v[key]);

//       // Last resort: pick the first string field that isn’t ID
//       for (const k in v) {
//         if (k.toLowerCase() === "id") continue;
//         if (typeof v[k] === "string" && v[k].trim()) return v[k];
//       }
//       return "";
//     }

//     return String(v);
//   }

//   // Date input YYYY-MM-DD -> DD-MMM-YYYY (Zoho-friendly)
//   function toZohoDate(dateStr) {
//     if (!dateStr) return "";
//     if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) return dateStr;

//     const parts = dateStr.split("-");
//     if (parts.length !== 3) return dateStr;

//     const y = parts[0];
//     const m = parseInt(parts[1], 10);
//     const d = parts[2];
//     const MMM = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1];
//     if (!MMM) return dateStr;

//     return String(d).padStart(2, "0") + "-" + MMM + "-" + y;
//   }

//   function normalizeName(s) {
//     return String(s || "").toLowerCase().replace(/[\s_-]/g, "");
//   }

//   // ─── META RESOLVE (fixes your 404 Not Found) ────────────────────────────────
//   async function resolveReportLinkName(nameOrLink) {
//     const resp = await ZOHO.CREATOR.META.getReports({ app_name: APP_LINK_NAME });
//     if (!resp || resp.code !== 3000) throw new Error("META.getReports failed: " + JSON.stringify(resp));

//     const reports = resp.reports || [];
//     const targetN = normalizeName(nameOrLink);

//     let hit = reports.find(r => r.link_name === nameOrLink)
//            || reports.find(r => r.display_name === nameOrLink)
//            || reports.find(r => normalizeName(r.link_name) === targetN)
//            || reports.find(r => normalizeName(r.display_name) === targetN);

//     if (!hit) {
//       console.log("[DEBUG] Available reports:", reports);
//       throw new Error(
//         "Report not found for '" + nameOrLink + "'. " +
//         "Open console: [DEBUG] Available reports shows link_name to use."
//       );
//     }
//     return hit.link_name;
//   }

//   async function resolveFormLinkName(nameOrLink) {
//     const resp = await ZOHO.CREATOR.META.getForms({ app_name: APP_LINK_NAME });
//     if (!resp || resp.code !== 3000) throw new Error("META.getForms failed: " + JSON.stringify(resp));

//     const forms = resp.forms || [];
//     const targetN = normalizeName(nameOrLink);

//     let hit = forms.find(f => f.link_name === nameOrLink)
//            || forms.find(f => f.display_name === nameOrLink)
//            || forms.find(f => normalizeName(f.link_name) === targetN)
//            || forms.find(f => normalizeName(f.display_name) === targetN);

//     if (!hit) {
//       console.log("[DEBUG] Available forms:", forms);
//       throw new Error(
//         "Form not found for '" + nameOrLink + "'. " +
//         "Open console: [DEBUG] Available forms shows link_name to use."
//       );
//     }
//     return hit.link_name;
//   }

//   // ─── DATA: GET RECORDS (v2) ────────────────────────────────────────────────
//   async function fetchAllPriceRecords() {
//     let all = [];
//     let cursor = null;

//     while (true) {
//       const config = {
//         report_name: PRICE_LIST_REPORT_LINK,
//         criteria: "(Latest_Pricing == true)",
//         max_records: 1000
//       };
//       if (cursor) config.record_cursor = cursor;

//       const resp = await ZOHO.CREATOR.DATA.getRecords(config);
//       console.log("[DATA.getRecords]", JSON.stringify(resp).slice(0, 300));

//       if (!resp || resp.code !== 3000) {
//         throw new Error("getRecords failed: " + JSON.stringify(resp));
//       }

//       all = all.concat(resp.data || []);
//       cursor = resp.record_cursor;
//       if (!cursor) break;
//     }

//     return all;
//   }

//   // ─── DATA: ADD RECORDS (v2) ────────────────────────────────────────────────
//   function chunk(arr, size) {
//     const out = [];
//     for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//     return out;
//   }

//   async function insertQueueRecords(records) {
//     const batches = chunk(records, 200);

//     for (let b = 0; b < batches.length; b++) {
//       showLoader("Inserting batch " + (b + 1) + " of " + batches.length + "…");

//       const payloadData = (batches[b].length === 1) ? batches[b][0] : batches[b];

//       const resp = await ZOHO.CREATOR.DATA.addRecords({
//         form_name: QUEUE_FORM_LINK,
//         payload: { data: payloadData }
//       });

//       console.log("[DATA.addRecords]", JSON.stringify(resp).slice(0, 300));

//       if (!resp || resp.code !== 3000) {
//         throw new Error("addRecords failed: " + JSON.stringify(resp));
//       }
//     }
//   }

//   // ─── CASCADING FILTERS ──────────────────────────────────────────────────────
//   function buildHotelList(records) {
//     const seen = new Set();
//     records.forEach(r => { const h = fieldVal(r, "Hotel_Name").trim(); if (h) seen.add(h); });
//     return [...seen].sort();
//   }

//   function getLaundryTypes(hotel) {
//     const seen = new Set();
//     allPriceRecords
//       .filter(r => fieldVal(r, "Hotel_Name").trim() === hotel)
//       .forEach(r => { const t = fieldVal(r, "Laundry_Type").trim(); if (t) seen.add(t); });
//     return [...seen].sort();
//   }

//   function getLaundryItems(hotel, type) {
//     const seen = new Set();
//     allPriceRecords
//       .filter(r => fieldVal(r, "Hotel_Name").trim() === hotel && fieldVal(r, "Laundry_Type").trim() === type)
//       .forEach(r => { const i = fieldVal(r, "Laundry_Item").trim(); if (i) seen.add(i); });
//     return [...seen].sort().concat(["Others"]);
//   }

//   // ─── EVENTS ────────────────────────────────────────────────────────────────
//   elHotel.addEventListener("change", function () {
//     setSelectOptions(elLaundryType, []); elLaundryType.disabled = true;
//     setSelectOptions(elLaundryItem, []); elLaundryItem.disabled = true;
//     elGroupRemark.style.display = "none";

//     const hotel = elHotel.value;
//     if (!hotel) return;

//     setSelectOptions(elLaundryType, getLaundryTypes(hotel));
//     elLaundryType.disabled = false;
//   });

//   elLaundryType.addEventListener("change", function () {
//     setSelectOptions(elLaundryItem, []); elLaundryItem.disabled = true;
//     elGroupRemark.style.display = "none";

//     const hotel = elHotel.value, type = elLaundryType.value;
//     if (!hotel || !type) return;

//     setSelectOptions(elLaundryItem, getLaundryItems(hotel, type));
//     elLaundryItem.disabled = false;
//   });

//   elLaundryItem.addEventListener("change", function () {
//     if (elLaundryItem.value === "Others") {
//       elGroupRemark.style.display = "flex"; elRemark.focus();
//     } else {
//       elGroupRemark.style.display = "none"; elRemark.value = "";
//     }
//   });

//   function validate() {
//     let ok = true;
//     [
//       ["group-Laundry_Type", elLaundryType],
//       ["group-Wash_Type",    elWashType],
//       ["group-Service_Type", elServiceType],
//       ["group-Date_field",   elDate],
//       ["group-Laundry_Item", elLaundryItem],
//       ["group-Order_Number", elOrderNo],
//     ].forEach(function ([id, el]) {
//       markValid(id);
//       if (!String(el.value || "").trim()) { markError(id); ok = false; }
//     });

//     markValid("group-Pack_Size");
//     if (getInt(elPackSize) <= 0) { markError("group-Pack_Size"); ok = false; }

//     if (getInt(elClean) + getInt(elStain) + getInt(elTorn) <= 0) {
//       toast("Enter at least one quantity (Clean, Stain, or Torn).", "error");
//       ok = false;
//     }

//     if (elLaundryItem.value === "Others" && !String(elRemark.value || "").trim()) {
//       toast("Please fill in Remark for 'Others'.", "error");
//       ok = false;
//     }

//     return ok;
//   }

//   function buildQueueRecords(sessionId) {
//     const hotelName   = elHotel.value.trim();
//     const dateVal     = toZohoDate(elDate.value);
//     const washType    = elWashType.value.trim();
//     const serviceType = elServiceType.value.trim();
//     const orderNo     = elOrderNo.value.trim();
//     const laundryItem = elLaundryItem.value.trim();
//     const remarkVal   = elRemark.value.trim();

//     const packSize    = getInt(elPackSize);
//     const cleanTotal  = getInt(elClean);
//     const stainTotal  = getInt(elStain);
//     const tornTotal   = getInt(elTorn);

//     const finalBillNo   = serviceType ? orderNo + " (" + serviceType + ")" : orderNo;
//     const finalItemText = laundryItem === "Others" ? remarkVal : laundryItem;

//     const records = [];
//     [
//       { key: "Normal", qty: cleanTotal },
//       { key: "Stain",  qty: stainTotal },
//       { key: "Torn",   qty: tornTotal  },
//     ].forEach(function (cat) {
//       if (cat.qty <= 0) return;

//       const numPack   = Math.ceil(cat.qty / packSize);
//       const remainder = cat.qty % packSize;

//       for (let idx = 1; idx <= Math.min(numPack, MAX_LABEL_SLOTS); idx++) {
//         records.push({
//           Hotel_Name:        hotelName,
//           Date_field:        dateVal,
//           Label_Status:      cat.key,
//           Label_PackQty:     (idx === numPack && remainder > 0) ? remainder : packSize,
//           Label_IndexText:   idx + "/" + numPack,
//           Label_RemarkFinal: washType + " (" + cat.key + ")",
//           Label_BillNoFinal: finalBillNo,
//           Label_ItemFinal:   finalItemText,
//           Session_ID:        sessionId,
//         });
//       }
//     });

//     return records;
//   }

//   elBtnPrint.addEventListener("click", async function () {
//     if (!validate()) return;

//     elBtnPrint.disabled = true;
//     try {
//       const sessionId = Date.now().toString();
//       showLoader("Preparing labels…");

//       const records = buildQueueRecords(sessionId);
//       if (!records.length) {
//         toast("No labels to generate.", "error");
//         hideLoader();
//         return;
//       }

//       await insertQueueRecords(records);

//       hideLoader();
//       setStatus(records.length + " label(s) queued", "success");
//       toast(records.length + " label(s) ready — opening print page…", "success");

//       const url =
//         "https://creatorapp.zoho.com/" + OWNER + "/" + APP_LINK_NAME +
//         "/#Page:" + PRINT_PAGE + "?session_id=" + sessionId;

//       // Prefer widget-safe navigation if available
//       if (ZOHO.CREATOR.UTIL && typeof ZOHO.CREATOR.UTIL.navigateParentURL === "function") {
//         ZOHO.CREATOR.UTIL.navigateParentURL({ action: "open", url: url, window: "same" });
//       } else {
//         window.top.location.href = url;
//       }

//     } catch (err) {
//       hideLoader();
//       setStatus("Error", "error");
//       toast("Error: " + String(err.message || err), "error", 8000);
//       console.error(err);
//     } finally {
//       elBtnPrint.disabled = false;
//     }
//   });

//   elBtnReset.addEventListener("click", function () {
//     document.getElementById("labelForm").reset();
//     setSelectOptions(elLaundryType, []); elLaundryType.disabled = true;
//     setSelectOptions(elLaundryItem, []); elLaundryItem.disabled = true;
//     elGroupRemark.style.display = "none";
//     document.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
//     setStatus("Ready");
//   });

//   // ─── INIT ────────────────────────────────────────────────────────────────────
//   async function init() {
//     showLoader("Initialising…");
//     setStatus("Initialising…");

//     try {
//       if (!window.ZOHO || !ZOHO.CREATOR || !ZOHO.CREATOR.DATA || !ZOHO.CREATOR.META) {
//         throw new Error("Widget SDK v2 not loaded (ZOHO.CREATOR.* missing).");
//       }

//       // 🔥 This is what fixes your 404: resolve real link names
//       showLoader("Resolving report/form link names…");
//       PRICE_LIST_REPORT_LINK = await resolveReportLinkName(PRICE_LIST_REPORT_HINT);
//       QUEUE_FORM_LINK        = await resolveFormLinkName(QUEUE_FORM_HINT);

//       console.log("[RESOLVED] report link =", PRICE_LIST_REPORT_LINK);
//       console.log("[RESOLVED] form link   =", QUEUE_FORM_LINK);

//       showLoader("Loading price list…");
//       allPriceRecords = await fetchAllPriceRecords();

//       setSelectOptions(elHotel, buildHotelList(allPriceRecords));

//       hideLoader();
//       setStatus("Ready (" + allPriceRecords.length + " records)");
//       toast("Loaded " + allPriceRecords.length + " active pricing records.", "info", 3000);

//     } catch (err) {
//       hideLoader();
//       setStatus("Load failed", "error");
//       toast(String(err.message || err), "error", 10000);
//       console.error(err);
//     }
//   }

//   init();

// })();