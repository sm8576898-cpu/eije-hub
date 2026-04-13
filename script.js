let currentCategoryFilter = "All";
let notices = [];
let resources = [];

setTimeout(initFirebase, 500);

function initFirebase() {
    const { auth, onAuthStateChanged } = window.firebaseAuth;
    const { db, ref, onValue } = window.firebaseDb;

    onAuthStateChanged(auth, (user) => {
        if (user) showAdminPanel();
        else hideAdminPanel();
    });

    onValue(ref(db, "resources"), (snapshot) => {
        resources = [];
        snapshot.forEach((child) => {
            resources.push({ id: child.key, ...child.val() });
        });
        resources.sort((a, b) => b.createdAt - a.createdAt);
        renderUI();
    });

    onValue(ref(db, "notices"), (snapshot) => {
        notices = [];
        snapshot.forEach((child) => {
            notices.push({ id: child.key, ...child.val() });
        });
        notices.sort((a, b) => b.createdAt - a.createdAt);
        renderUI();
    });
}

function formatDate(dateString) {
    if(!dateString) return "";
    const parts = dateString.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateString;
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const resDate = document.getElementById("newDateRes");
    const notDate = document.getElementById("newDateNot");
    if(resDate) resDate.value = today;
    if(notDate) notDate.value = today;
}

const modal = document.getElementById("adminModal");

document.getElementById("loginBtn").onclick = () => {
    modal.style.display = "block";
    document.getElementById("adminEmail").focus();
};

function closeModal() { 
    modal.style.display = "none"; 
    document.getElementById("adminEmail").value = "";
    document.getElementById("adminPass").value = ""; 
    document.getElementById("loginError").style.display = "none";
}

async function checkLogin() {
    const email = document.getElementById("adminEmail").value;
    const pass = document.getElementById("adminPass").value;
    const err = document.getElementById("loginError");
    
    try {
        const { auth, signInWithEmailAndPassword } = window.firebaseAuth;
        await signInWithEmailAndPassword(auth, email, pass);
        closeModal();
    } catch (error) {
        err.innerText = "Wrong email or password.";
        err.style.display = "block";
    }
}

async function logoutAdmin() {
    const { auth, signOut } = window.firebaseAuth;
    await signOut(auth);
}

function showAdminPanel() {
    document.getElementById("studentView").style.display = "none";
    document.getElementById("adminDashboard").style.display = "block";
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "block";
    setDefaultDates();
    renderUI();
}

function hideAdminPanel() {
    document.getElementById("studentView").style.display = "block";
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("loginBtn").style.display = "block";
    document.getElementById("logoutBtn").style.display = "none";
    renderUI();
}

async function addResource() {
    const title = document.getElementById("newTitle").value.trim();
    const link = document.getElementById("newLink").value.trim();
    const rawDate = document.getElementById("newDateRes").value || new Date().toISOString().split('T')[0];
    
    if(!title || !link) return alert("Please fill both Title and Link!");

    const { db, ref, push } = window.firebaseDb;
    
    await push(ref(db, "resources"), {
        sem: document.getElementById("newSem").value,
        category: document.getElementById("newCat").value,
        title: title,
        link: link,
        date: formatDate(rawDate),
        createdAt: Date.now()
    });
    
    document.getElementById("newTitle").value = "";
    document.getElementById("newLink").value = "";
    setDefaultDates();
}

async function addNotice() {
    const text = document.getElementById("newNoticeText").value.trim();
    const rawDate = document.getElementById("newDateNot").value || new Date().toISOString().split('T')[0];
    
    if(!text) return alert("Notice cannot be empty!");

    const { db, ref, push } = window.firebaseDb;

    await push(ref(db, "notices"), {
        text: text, 
        isUrgent: document.getElementById("newNoticeUrgent").checked,
        date: formatDate(rawDate),
        createdAt: Date.now()
    });
    
    document.getElementById("newNoticeText").value = "";
    document.getElementById("newNoticeUrgent").checked = false;
    setDefaultDates();
}

async function deleteItem(type, id) {
    if(!confirm("Are you sure you want to permanently delete this?")) return;
    
    const { db, ref, remove } = window.firebaseDb;
    const path = type === 'res' ? `resources/${id}` : `notices/${id}`;
    
    await remove(ref(db, path));
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

function renderAdminLists() {
    const resList = document.getElementById("adminResourceList");
    const notList = document.getElementById("adminNoticeList");
    
    resList.innerHTML = resources.length === 0 ? "<li style='color:#a0a4cc;'>No resources uploaded yet.</li>" : "";
    resources.forEach(r => {
        resList.innerHTML += `
            <li>
                <div style="max-width: 70%;"><strong>[${r.sem}]</strong> ${r.title} <span class="date-badge">${r.date}</span><br><span style="font-size:11px; color:#a0a4cc;">${r.category}</span></div> 
                <button class="delete-btn" onclick="deleteItem('res', '${r.id}')">Delete</button>
            </li>
        `;
    });
    
    notList.innerHTML = notices.length === 0 ? "<li style='color:#a0a4cc;'>No notices added yet.</li>" : "";
    notices.forEach(n => {
        notList.innerHTML += `
            <li>
                <div style="max-width: 70%; line-height: 1.4;">${n.text} <br><span class="date-badge" style="margin-top:5px; display:inline-block;">${n.date}</span></div> 
                <button class="delete-btn" onclick="deleteItem('not', '${n.id}')">Delete</button>
            </li>
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

document.getElementById("semesterFilter").addEventListener("change", renderUI);
document.getElementById("searchResource").addEventListener("keyup", renderUI);