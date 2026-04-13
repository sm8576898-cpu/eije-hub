const ADMIN_PASS = "admin123"; 
let currentCategoryFilter = "All";

let notices = JSON.parse(localStorage.getItem('eijeNotices')) || [
    { id: 1, text: "Welcome to EIJE Resource Hub! Official notices will appear here.", isUrgent: false, date: "13/04/2026" }
];

let resources = JSON.parse(localStorage.getItem('eijeResources')) || [];

function formatDate(dateString) {
    if(!dateString) return "";
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
}

// Set default dates to today for inputs
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const resDate = document.getElementById("newDateRes");
    const notDate = document.getElementById("newDateNot");
    if(resDate) resDate.value = today;
    if(notDate) notDate.value = today;
}

function renderUI() {
    renderNotices();
    renderStudentResources();
    if(document.getElementById("adminDashboard").style.display === "block") {
        renderAdminLists();
    }
}

function renderNotices() {
    const list = document.getElementById("noticeList");
    list.innerHTML = notices.length === 0 ? "<li style='color:#a0a4cc;'>No active notices at the moment.</li>" : "";
    
    notices.forEach(n => {
        let prefix = n.isUrgent ? `<strong style="color:#ff4b5c">Urgent:</strong> ` : `<strong style="color:#00d284">New:</strong> `;
        let dateBadge = n.date ? `<span class="date-badge" style="float: right;">${n.date}</span>` : '';
        list.innerHTML += `<li>${prefix} ${n.text} ${dateBadge}</li>`;
    });
}

function renderStudentResources() {
    const sem = document.getElementById("semesterFilter").value;
    const query = document.getElementById("searchResource").value.toLowerCase();
    const listContainer = document.getElementById("resourceList");
    const titleHeader = document.getElementById("resourceSectionTitle");

    const filtered = resources.filter(r => {
        const matchSem = (sem === "All" || r.sem === sem);
        const matchCat = (currentCategoryFilter === "All" || r.category === currentCategoryFilter);
        const matchSearch = r.title.toLowerCase().includes(query);
        return matchSem && matchCat && matchSearch;
    });

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        titleHeader.style.display = "none";
        return;
    }

    titleHeader.style.display = "block";
    titleHeader.innerText = currentCategoryFilter === "All" ? "Available Resources" : `${currentCategoryFilter} Downloads`;

    filtered.forEach(r => {
        listContainer.innerHTML += `
            <div class="resource-item">
                <div class="resource-info">
                    <h4>${r.title} <span class="date-badge">${r.date || 'No Date'}</span></h4>
                    <p>Semester: ${r.sem.replace('Sem', '')} | Type: ${r.category}</p>
                </div>
                <a href="${r.link}" target="_blank" class="download-btn">Open PDF</a>
            </div>
        `;
    });
}

function setCategoryFilter(cat) {
    if(currentCategoryFilter === cat) {
        currentCategoryFilter = "All";
    } else {
        currentCategoryFilter = cat;
    }

    const cards = document.querySelectorAll(".category-card");
    cards.forEach(card => {
        card.classList.remove("active");
        if(currentCategoryFilter !== "All" && card.innerHTML.includes(cat)) {
            card.classList.add("active");
        }
    });
    renderUI();
}

// --- Admin Authentication ---
const modal = document.getElementById("adminModal");

document.getElementById("loginBtn").onclick = () => {
    modal.style.display = "block";
    document.getElementById("adminPass").focus();
};

function closeModal() { 
    modal.style.display = "none"; 
    document.getElementById("adminPass").value = ""; 
}

function checkLogin() {
    if(document.getElementById("adminPass").value === ADMIN_PASS) {
        document.getElementById("studentView").style.display = "none";
        document.getElementById("adminDashboard").style.display = "block";
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
        setDefaultDates(); // Set today's date automatically
        closeModal();
        renderUI();
    } else {
        alert("Incorrect Password! Access Denied.");
    }
}

function logoutAdmin() {
    document.getElementById("studentView").style.display = "block";
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("loginBtn").style.display = "block";
    document.getElementById("logoutBtn").style.display = "none";
    renderUI();
}

// --- Admin Form Operations ---
function addResource() {
    const title = document.getElementById("newTitle").value.trim();
    const link = document.getElementById("newLink").value.trim();
    const rawDate = document.getElementById("newDateRes").value || new Date().toISOString().split('T')[0];
    
    if(!title || !link) return alert("Please fill both Title and Link!");

    resources.unshift({
        id: Date.now(),
        sem: document.getElementById("newSem").value,
        category: document.getElementById("newCat").value,
        title: title,
        link: link,
        date: formatDate(rawDate)
    });
    
    document.getElementById("newTitle").value = "";
    document.getElementById("newLink").value = "";
    setDefaultDates();
    saveData();
}

function addNotice() {
    const text = document.getElementById("newNoticeText").value.trim();
    const rawDate = document.getElementById("newDateNot").value || new Date().toISOString().split('T')[0];
    
    if(!text) return alert("Notice cannot be empty!");

    notices.unshift({ 
        id: Date.now(), 
        text: text, 
        isUrgent: document.getElementById("newNoticeUrgent").checked,
        date: formatDate(rawDate)
    });
    
    document.getElementById("newNoticeText").value = "";
    document.getElementById("newNoticeUrgent").checked = false;
    setDefaultDates();
    saveData();
}

function deleteItem(type, id) {
    if(!confirm("Are you sure you want to permanently delete this item?")) return;
    
    if(type === 'res') {
        resources = resources.filter(r => r.id !== id);
    } else {
        notices = notices.filter(n => n.id !== id);
    }
    saveData();
}

function saveData() {
    localStorage.setItem('eijeResources', JSON.stringify(resources));
    localStorage.setItem('eijeNotices', JSON.stringify(notices));
    renderUI();
}

function renderAdminLists() {
    const resList = document.getElementById("adminResourceList");
    const notList = document.getElementById("adminNoticeList");
    
    resList.innerHTML = resources.length === 0 ? "<li style='color:#a0a4cc;'>No resources uploaded yet.</li>" : "";
    resources.forEach(r => {
        resList.innerHTML += `
            <li>
                <div style="max-width: 70%;"><strong>[${r.sem}]</strong> ${r.title} <span class="date-badge">${r.date}</span><br><span style="font-size:11px; color:#a0a4cc;">${r.category}</span></div> 
                <button class="delete-btn" onclick="deleteItem('res', ${r.id})">Delete</button>
            </li>
        `;
    });
    
    notList.innerHTML = notices.length === 0 ? "<li style='color:#a0a4cc;'>No notices added yet.</li>" : "";
    notices.forEach(n => {
        notList.innerHTML += `
            <li>
                <div style="max-width: 70%; line-height: 1.4;">${n.text} <br><span class="date-badge" style="margin-top:5px; display:inline-block;">${n.date}</span></div> 
                <button class="delete-btn" onclick="deleteItem('not', ${n.id})">Delete</button>
            </li>
        `;
    });
}

document.getElementById("semesterFilter").addEventListener("change", renderUI);
document.getElementById("searchResource").addEventListener("keyup", renderUI);

window.onload = renderUI;