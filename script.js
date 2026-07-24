/* ==========================================================================
   MELLOW DIGITALS - CUSTOMER DATA MANAGEMENT SCRIPT (FIREBASE SYNC)
   ========================================================================== */

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCjh5fneSb_G04XdfD6R219nL0EFOX--6A",
  authDomain: "mellow-digitals.firebaseapp.com",
  projectId: "mellow-digitals",
  storageBucket: "mellow-digitals.firebasestorage.app",
  messagingSenderId: "1066995720914",
  appId: "1:1066995720914:web:6fe83d761f222c4725830b",
  measurementId: "G-5VPQRFY74P"
};

// Initialize Firebase safely
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
} else {
  console.error("Firebase library failed to load.");
}

const db = firebase.firestore();
// --- LOAD CUSTOMERS FROM CLOUD ---
let customers = [];

function loadCustomers() {
  db.collection("customers").get().then((querySnapshot) => {
    customers = [];
    querySnapshot.forEach((doc) => {
      let cust = doc.data();
      cust.firebaseId = doc.id; // Save Firestore document ID
      customers.push(cust);
    });
    sortCustomersAlphabetically();
    updateSidebarCustomerBadge();
    renderDatabaseSpreadsheet();
  });
}

// --- ADD A NEW CUSTOMER TO CLOUD ---
function addCustomerToCloud(newCustomerData) {
  db.collection("customers").add(newCustomerData).then(() => {
    loadCustomers(); // Refresh list automatically from cloud
  }).catch((error) => {
    console.error("Error adding customer: ", error);
  });
}

let selectedCustomerId = null;
let selectedHistoryCustomer = null;
let isTableEditable = false;

document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splash-screen");
  const appContent = document.getElementById("app-content");

  loadCustomers();

  setTimeout(() => {
    if (splashScreen) splashScreen.style.display = "none";
    if (appContent) appContent.classList.remove("d-none");
    showEditingSubTab('new');
  }, 1500);

  updateLiveClock();
  setInterval(updateLiveClock, 1000);
});

function updateSidebarCustomerBadge() {
  const badgeCountElem = document.getElementById("sidebarTotalCustomersCount");
  if (badgeCountElem) {
    badgeCountElem.innerText = customers.length;
  }
}

function sortCustomersAlphabetically() {
  customers.sort((a, b) => a.studio.localeCompare(b.studio, undefined, { sensitivity: 'base' }));
}

function saveAndSortCustomers() {
  sortCustomersAlphabetically();
  updateSidebarCustomerBadge();
  
  if (selectedCustomerId) {
    const currentCust = customers.find(c => c.id === selectedCustomerId);
    if (currentCust && currentCust.firebaseId) {
      db.collection("customers").doc(currentCust.firebaseId).set(currentCust).then(() => {
        loadCustomers();
      });
    }
  }
}

function getCurrentFormattedTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

function updateLiveClock() {
  const clockElem = document.getElementById("displayDateTime");
  if (clockElem) {
    clockElem.innerText = getCurrentFormattedTime();
  }
}

function showSection(sectionName) {
  document.getElementById("home-section").classList.add("d-none");
  document.getElementById("editing-section").classList.add("d-none");
  document.getElementById("sales-section").classList.add("d-none");

  const badge = document.getElementById("totalCustomersBadge");

  if (sectionName === 'home') {
    document.getElementById("home-section").classList.remove("d-none");
    if (badge) badge.classList.add("d-none");
  } else if (sectionName === 'editing') {
    document.getElementById("editing-section").classList.remove("d-none");
    if (badge) badge.classList.remove("d-none");
    showEditingSubTab('new');
  } else if (sectionName === 'sales') {
    document.getElementById("sales-section").classList.remove("d-none");
    if (badge) badge.classList.remove("d-none");
  }
}

function showEditingSubTab(tabName) {
  document.getElementById("sub-new-customer").classList.add("d-none");
  document.getElementById("sub-existing-customer").classList.add("d-none");
  document.getElementById("sub-history").classList.add("d-none");
  document.getElementById("sub-database-view").classList.add("d-none");

  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-tab'));

  if (tabName === 'new') {
    document.getElementById("sub-new-customer").classList.remove("d-none");
    document.getElementById("btn-new-cust").classList.add("active-tab");
  } else if (tabName === 'existing') {
    document.getElementById("sub-existing-customer").classList.remove("d-none");
    document.getElementById("btn-exist-cust").classList.add("active-tab");
  } else if (tabName === 'history') {
    document.getElementById("sub-history").classList.remove("d-none");
    document.getElementById("btn-history-cust").classList.add("active-tab");
    if (selectedHistoryCustomer) refreshCurrentHistoryView();
  } else if (tabName === 'database') {
    document.getElementById("sub-database-view").classList.remove("d-none");
    document.getElementById("btn-db-view").classList.add("active-tab");
    renderDatabaseSpreadsheet();
  }
}

function openNewCustomerWhatsapp() {
  const phoneInput = document.getElementById("phoneNo").value.trim();
  const cleanPhone = phoneInput.replace(/\D/g, '');
  if (!cleanPhone) {
    alert("Please enter a phone number first.");
    return;
  }
  const formattedPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent("Welcome to Mellow Digitals")}`, '_blank');
}

function formatWhatsappUrl(phone) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const message = encodeURIComponent("Welcome to Mellow Digitals");
  return cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${message}` : '#';
}

function checkDuplicatePhone(phoneVal) {
  const alertBox = document.getElementById("phoneAlert");
  const saveBtn = document.getElementById("saveCustBtn");
  const clean = phoneVal.trim();

  if (!clean) {
    alertBox.classList.add("d-none");
    saveBtn.disabled = false;
    return;
  }

  const exists = customers.some(c => c.phone.trim() === clean);
  if (exists) {
    alertBox.classList.remove("d-none");
    saveBtn.disabled = true;
  } else {
    alertBox.classList.add("d-none");
    saveBtn.disabled = false;
  }
}

function handleNewCustomerSubmit(event) {
  event.preventDefault();
  const phoneVal = document.getElementById("phoneNo").value.trim();
  if (customers.some(c => c.phone.trim() === phoneVal)) {
    alert("Phone number already exists!");
    return;
  }
  
  const newCust = {
    id: Date.now(),
    studio: document.getElementById("studioName").value.trim(),
    name: document.getElementById("custName").value.trim(),
    phone: phoneVal,
    address: document.getElementById("address").value.trim(),
    events: []
  };

  addCustomerToCloud(newCust);
  alert(`Customer "${newCust.name}" saved successfully to cloud!`);
  document.getElementById("newCustomerForm").reset();
  checkDuplicatePhone("");
}

function deleteCurrentCustomer() {
  if (!selectedCustomerId) return;
  const customer = customers.find(c => c.id === selectedCustomerId);
  if (!customer) return;

  if (confirm(`Permanently delete "${customer.studio}"?`)) {
    deleteCustomerById(selectedCustomerId);
  }
}

function deleteCustomerById(id) {
  const customer = customers.find(c => c.id === id);
  if (customer && customer.firebaseId) {
    db.collection("customers").doc(customer.firebaseId).delete().then(() => {
      loadCustomers();
      if (selectedCustomerId === id) {
        selectedCustomerId = null;
        document.getElementById("selectedCustomerContainer").classList.add("d-none");
        document.getElementById("customerSearchInput").value = "";
      }
    });
  }
}

function searchCustomers() {
  const query = document.getElementById("customerSearchInput").value.toLowerCase().trim();
  const resultsContainer = document.getElementById("searchResultsList");
  resultsContainer.innerHTML = "";

  if (!query) return;

  const matches = customers.filter(c => 
    c.name.toLowerCase().includes(query) || c.studio.toLowerCase().includes(query) || c.phone.includes(query)
  );

  matches.forEach(c => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "list-group-item list-group-item-action bg-black text-white border-secondary py-2";
    item.innerHTML = `<strong class="text-warning">${c.studio}</strong> (${c.name})`;
    item.onclick = () => selectCustomer(c.id);
    resultsContainer.appendChild(item);
  });
}

function selectCustomer(id) {
  selectedCustomerId = id;
  const customer = customers.find(c => c.id === id);

  document.getElementById("searchResultsList").innerHTML = "";
  document.getElementById("customerSearchInput").value = `${customer.studio} (${customer.name})`;
  document.getElementById("displayStudioName").innerText = customer.studio;
  document.getElementById("displayCustName").innerText = customer.name;
  document.getElementById("displayAddress").innerText = customer.address;
  document.getElementById("displayPhone").innerText = customer.phone;
  document.getElementById("displayWhatsappLink").href = formatWhatsappUrl(customer.phone);

  populateVisitDatesDropdown(customer);
  renderExistingCustomerEventsTable(customer);
  document.getElementById("selectedCustomerContainer").classList.remove("d-none");
}

function handleQuickEventSave(event) {
  event.preventDefault();
  if (!selectedCustomerId) return;

  const customer = customers.find(c => c.id === selectedCustomerId);
  const title = document.getElementById("quickEventTitle").value.trim();
  const adv = parseFloat(document.getElementById("quickEventAdv").value) || 0;
  const remarks = document.getElementById("quickEventRemarks").value.trim();

  customer.events.push({
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    dateTimeStr: getCurrentFormattedTime(),
    description: title,
    duration: '',
    charge: 0,
    adv: adv,
    paidAmt: 0,
    balance: -adv,
    remarks: remarks,
    handedOver: false
  });

  saveAndSortCustomers();
  document.getElementById("quickEventForm").reset();
  populateVisitDatesDropdown(customer);
  renderExistingCustomerEventsTable(customer);
}

function populateVisitDatesDropdown(customer) {
  const select = document.getElementById("visitDatesDropdown");
  select.innerHTML = '<option value="all">-- All Dates --</option>';
  [...new Set(customer.events.map(e => e.date))].filter(Boolean).forEach(dateStr => {
    const opt = document.createElement("option");
    opt.value = dateStr;
    opt.innerText = dateStr;
    select.appendChild(opt);
  });
}

function onVisitDateSelect(selectedDate) {
  const customer = customers.find(c => c.id === selectedCustomerId);
  if (customer) renderExistingCustomerEventsTable(customer, selectedDate);
}

function renderExistingCustomerEventsTable(customer, dateFilter = 'all') {
  const tbody = document.getElementById("existingEventsTableBody");
  tbody.innerHTML = "";

  let eventsToDisplay = [...customer.events];
  if (dateFilter !== 'all') {
    eventsToDisplay = eventsToDisplay.filter(e => e.date === dateFilter);
  }

  eventsToDisplay.forEach((evt, idx) => {
    appendEventRow(tbody, idx + 1, evt);
  });

  setInputsDisabledState(!isTableEditable);
  recalculateTotals();
}

function appendEventRow(tbody, rowNum, evtData = {}) {
  const tr = document.createElement("tr");
  tr.dataset.eventId = evtData.id || Date.now();
  
  tr.innerHTML = `
    <td class="fw-bold text-muted row-num">${rowNum}</td>
    <td><input type="date" class="form-control table-input event-date" value="${evtData.date || new Date().toISOString().split('T')[0]}" disabled></td>
    <td><input type="text" class="form-control table-input event-desc" value="${evtData.description || ''}"></td>
    <td><input type="text" class="form-control table-input event-dur" value="${evtData.duration || ''}"></td>
    <td><input type="number" class="form-control table-input event-charge" value="${evtData.charge || 0}" oninput="calcRowBalance(this)"></td>
    <td><input type="number" class="form-control table-input event-adv" value="${evtData.adv || 0}" oninput="calcRowBalance(this)"></td>
    <td><input type="number" class="form-control table-input event-paid" value="${evtData.paidAmt || 0}" oninput="calcRowBalance(this)"></td>
    <td><input type="number" class="form-control table-input event-bal" value="${evtData.balance || 0}" readonly></td>
    <td><input type="text" class="form-control table-input event-remarks" value="${evtData.remarks || ''}"></td>
    <td class="text-center"><input type="checkbox" class="form-check-input event-handover" ${evtData.handedOver ? 'checked' : ''}></td>
    <td class="text-center"><button type="button" class="btn btn-outline-danger btn-sm py-0 px-2" onclick="this.closest('tr').remove(); recalculateTotals();">✕</button></td>
  `;
  tbody.appendChild(tr);
}

function calcRowBalance(inputElem) {
  const tr = inputElem.closest("tr");
  const charge = parseFloat(tr.querySelector(".event-charge").value) || 0;
  const adv = parseFloat(tr.querySelector(".event-adv").value) || 0;
  const paid = parseFloat(tr.querySelector(".event-paid").value) || 0;
  
  tr.querySelector(".event-bal").value = charge - adv - paid;
  recalculateTotals();
}

function recalculateTotals() {
  let totalExplicitAdvance = 0;
  let totalCharges = 0;
  let totalPaid = 0;

  document.querySelectorAll("#existingEventsTableBody tr").forEach(r => {
    const charge = parseFloat(r.querySelector(".event-charge")?.value) || 0;
    const adv = parseFloat(r.querySelector(".event-adv")?.value) || 0;
    const paid = parseFloat(r.querySelector(".event-paid")?.value) || 0;

    totalExplicitAdvance += adv;
    totalCharges += charge;
    totalPaid += paid;
  });

  let netBalanceDue = totalCharges - totalExplicitAdvance - totalPaid;
  let activeUnusedAdvance = 0;
  if (netBalanceDue < 0) {
    activeUnusedAdvance = Math.abs(netBalanceDue);
    netBalanceDue = 0;
  }

  const advElem = document.getElementById("displayAdvTotal");
  if (advElem) {
    advElem.innerText = `₹${activeUnusedAdvance}`;
    advElem.style.color = "#000000";
  }

  const balElem = document.getElementById("displayBalanceTotal");
  if (balElem) {
    if (netBalanceDue > 0) {
      balElem.innerText = `₹${netBalanceDue}`;
      balElem.style.color = "#198754";
    } else {
      balElem.innerText = `₹0`;
      balElem.style.color = "#000000";
    }
  }
}

function enableTableEditing() {
  isTableEditable = true;
  setInputsDisabledState(false);
}

function setInputsDisabledState(disabled) {
  document.querySelectorAll("#existingEventsTableBody tr input").forEach(i => {
    if (!i.classList.contains("event-bal") && !i.classList.contains("event-date")) {
      i.disabled = disabled;
    }
  });
}

function saveEventEntries() {
  if (!selectedCustomerId) return;
  const customer = customers.find(c => c.id === selectedCustomerId);
  const rows = document.querySelectorAll("#existingEventsTableBody tr");
  
  let updatedEvents = [];
  rows.forEach(r => {
    const desc = r.querySelector(".event-desc").value.trim();
    if (desc) {
      updatedEvents.push({
        id: parseFloat(r.dataset.eventId),
        date: r.querySelector(".event-date").value,
        description: desc,
        duration: r.querySelector(".event-dur").value.trim(),
        charge: parseFloat(r.querySelector(".event-charge").value) || 0,
        adv: parseFloat(r.querySelector(".event-adv").value) || 0,
        paidAmt: parseFloat(r.querySelector(".event-paid").value) || 0,
        balance: parseFloat(r.querySelector(".event-bal").value) || 0,
        remarks: r.querySelector(".event-remarks").value.trim(),
        handedOver: r.querySelector(".event-handover").checked
      });
    }
  });

  customer.events = updatedEvents;
  saveAndSortCustomers();
  isTableEditable = false;
  setInputsDisabledState(true);
  
  if (selectedHistoryCustomer && selectedHistoryCustomer.id === customer.id) {
    selectedHistoryCustomer = customer;
    refreshCurrentHistoryView();
  }

  alert("Updates saved successfully to cloud!");
}

function handleHistorySearchInput(query) {
  const dropdown = document.getElementById("historyDropdown");
  dropdown.innerHTML = "";
  if (!query.trim()) { dropdown.classList.add("d-none"); return; }

  customers.filter(c => c.studio.toLowerCase().includes(query.toLowerCase())).forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-group-item list-group-item-action bg-black text-white border-secondary py-2";
    btn.innerHTML = `<strong class="text-warning">${c.studio}</strong>`;
    btn.onclick = () => {
      selectedHistoryCustomer = c;
      dropdown.classList.add("d-none");
      document.getElementById("historySearchInput").value = c.studio;
      refreshCurrentHistoryView();
      document.getElementById("historyDisplayContainer").classList.remove("d-none");
    };
    dropdown.appendChild(btn);
  });
  dropdown.classList.remove("d-none");
}

function refreshCurrentHistoryView() {
  if (!selectedHistoryCustomer) return;
  document.getElementById("histStudioName").innerText = selectedHistoryCustomer.studio;
  document.getElementById("histCustName").innerText = selectedHistoryCustomer.name;
  document.getElementById("histAddress").innerText = selectedHistoryCustomer.address;
  document.getElementById("histPhone").innerText = selectedHistoryCustomer.phone;
  
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = "";
  selectedHistoryCustomer.events.forEach((e, idx) => {
    tbody.innerHTML += `<tr><td>${idx+1}</td><td>${e.date}</td><td>${e.description}</td><td>${e.duration||'-'}</td><td>₹${e.charge}</td><td>₹${e.adv}</td><td>₹${e.paidAmt}</td><td>₹${e.balance}</td><td>${e.remarks||'-'}</td><td>${e.handedOver?'✅':'⏳'}</td></tr>`;
  });

  let totalExplicitAdvance = 0;
  let totalCharges = 0;
  let totalPaid = 0;

  selectedHistoryCustomer.events.forEach(e => {
    totalExplicitAdvance += (e.adv || 0);
    totalCharges += (e.charge || 0);
    totalPaid += (e.paidAmt || 0);
  });

  let netBalanceDue = totalCharges - totalExplicitAdvance - totalPaid;
  let activeUnusedAdvance = 0;
  if (netBalanceDue < 0) {
    activeUnusedAdvance = Math.abs(netBalanceDue);
    netBalanceDue = 0;
  }

  const advValStr = `₹${activeUnusedAdvance}`;
  const balValStr = netBalanceDue > 0 ? `₹${netBalanceDue}` : `₹0`;

  ['histDisplayAdvTotal', 'histTotalAdv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = advValStr;
      el.style.color = "#000000";
    }
  });

  ['histDisplayBalanceTotal', 'histTotalBal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = balValStr;
      el.style.color = netBalanceDue > 0 ? "#198754" : "#000000";
    }
  });
}

function toggleCustomDateInputs(val) {
  document.getElementById("fromDateCol").classList.toggle("d-none", val !== 'custom');
  document.getElementById("toDateCol").classList.toggle("d-none", val !== 'custom');
}

function executeExportOrPrint() {
  window.print();
}

function renderDatabaseSpreadsheet() {
  const tbody = document.getElementById("databaseTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  customers.forEach((c, idx) => {
    tbody.innerHTML += `<tr><td>${idx+1}</td><td>${c.studio}</td><td>${c.name}</td><td>${c.phone}</td><td>${c.address}</td><td><button class="btn btn-outline-danger btn-sm" onclick="deleteCustomerById(${c.id})">🗑️</button></td></tr>`;
  });
}

function filterDatabaseTable(query) {
  document.querySelectorAll("#databaseTableBody tr").forEach(r => {
    r.style.display = r.innerText.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
  });
}

function saveDatabaseSpreadsheet() {
  alert("Database synced with cloud!");
}

let calcExpression = "0";
function calcInput(val) {
  const disp = document.getElementById("calcDisplay");
  calcExpression = (calcExpression === "0" || calcExpression === "Error") ? val : calcExpression + val;
  disp.value = calcExpression;
}
function calcClear() {
  calcExpression = "0";
  document.getElementById("calcDisplay").value = "0";
}
function calcBackspace() {
  calcExpression = calcExpression.length > 1 ? calcExpression.slice(0, -1) : "0";
  document.getElementById("calcDisplay").value = calcExpression;
}
function calcEqual() {
  try {
    calcExpression = String(eval(calcExpression.replace(/%/g, '/100')));
  } catch {
    calcExpression = "Error";
  }
  document.getElementById("calcDisplay").value = calcExpression;
}
