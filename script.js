// ═══════════════════════════════════════════════════════════════════════════
// SUMMITKIT LISENSI STUDIO - MAIN SCRIPT
// ═══════════════════════════════════════════════════════════════════════════

// Data keys
const STORAGE_KEY = 'summitkit_licenses';
const SUSPECT_KEY = 'summitkit_suspects';
const BLACKLIST_KEY = 'summitkit_blacklist';

// ─────────────────────────────────────────────────────────────────────────
// INITIALIZE APP
// ─────────────────────────────────────────────────────────────────────────

window.onload = function() {
    loadData();
    updateAllDisplay();
};

// ─────────────────────────────────────────────────────────────────────────
// SECTION NAVIGATION
// ─────────────────────────────────────────────────────────────────────────

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active to clicked button
    event.target.classList.add('active');

    // Update displays
    updateAllDisplay();
}

// ─────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            window.licenses = JSON.parse(data);
        } else {
            window.licenses = [];
        }
    } catch (e) {
        console.error('Error loading licenses:', e);
        window.licenses = [];
    }

    try {
        const suspects = localStorage.getItem(SUSPECT_KEY);
        if (suspects) {
            window.suspects = JSON.parse(suspects);
        } else {
            window.suspects = [];
        }
    } catch (e) {
        console.error('Error loading suspects:', e);
        window.suspects = [];
    }

    try {
        const blacklist = localStorage.getItem(BLACKLIST_KEY);
        if (blacklist) {
            window.blacklist = JSON.parse(blacklist);
        } else {
            window.blacklist = [];
        }
    } catch (e) {
        console.error('Error loading blacklist:', e);
        window.blacklist = [];
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.licenses));
        localStorage.setItem(SUSPECT_KEY, JSON.stringify(window.suspects));
        localStorage.setItem(BLACKLIST_KEY, JSON.stringify(window.blacklist));
    } catch (e) {
        console.error('Error saving data:', e);
        alert('Gagal menyimpan data!');
    }
}

// ─────────────────────────────────────────────────────────────────────────
// ADD NEW LICENSE ID
// ─────────────────────────────────────────────────────────────────────────

function addNewId() {
    const idInput = document.getElementById('newId');
    const ownerInput = document.getElementById('newOwner');
    const notesInput = document.getElementById('newNotes');

    const id = idInput.value.trim();
    const owner = ownerInput.value.trim();
    const notes = notesInput.value.trim();

    // Validation
    if (!id) {
        alert('Masukkan ID terlebih dahulu!');
        idInput.focus();
        return;
    }

    if (isNaN(id) || id.length < 5) {
        alert('ID harus berupa angka yang valid!');
        return;
    }

    // Check if already exists
    if (window.licenses.some(lic => lic.id === id)) {
        alert('ID sudah ada di database!');
        return;
    }

    // Add new license
    const newLicense = {
        id: id,
        owner: owner || 'N/A',
        notes: notes || 'N/A',
        status: 'accepted',
        addedDate: new Date().toLocaleString('id-ID')
    };

    window.licenses.push(newLicense);
    saveData();

    // Clear inputs
    idInput.value = '';
    ownerInput.value = '';
    notesInput.value = '';

    // Update display
    updateAllDisplay();
    alert('ID berhasil ditambahkan!');
}

// ─────────────────────────────────────────────────────────────────────────
// TOGGLE LICENSE STATUS
// ─────────────────────────────────────────────────────────────────────────

function toggleStatus(id) {
    const license = window.licenses.find(lic => lic.id === id);
    if (license) {
        license.status = license.status === 'accepted' ? 'banned' : 'accepted';
        saveData();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE LICENSE ID
// ─────────────────────────────────────────────────────────────────────────

function deleteLicense(id) {
    if (confirm('Yakin ingin menghapus ID ini?')) {
        window.licenses = window.licenses.filter(lic => lic.id !== id);
        saveData();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// ADD SUSPECT/HACKER LOG
// ─────────────────────────────────────────────────────────────────────────

function addSuspect() {
    const idInput = document.getElementById('suspectId');
    const descInput = document.getElementById('suspectDesc');

    const id = idInput.value.trim();
    const desc = descInput.value.trim();

    if (!id || !desc) {
        alert('Masukkan ID dan deskripsi!');
        return;
    }

    const suspect = {
        id: id,
        description: desc,
        reportedDate: new Date().toLocaleString('id-ID')
    };

    window.suspects.push(suspect);
    saveData();

    idInput.value = '';
    descInput.value = '';

    updateAllDisplay();
    alert('Pencuri berhasil dicatat!');
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE SUSPECT
// ─────────────────────────────────────────────────────────────────────────

function deleteSuspect(index) {
    if (confirm('Hapus laporan ini?')) {
        window.suspects.splice(index, 1);
        saveData();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// ADD TO BLACKLIST
// ─────────────────────────────────────────────────────────────────────────

function addBlacklist() {
    const idInput = document.getElementById('blacklistId');
    const reasonInput = document.getElementById('blacklistReason');

    const id = idInput.value.trim();
    const reason = reasonInput.value.trim();

    if (!id || !reason) {
        alert('Masukkan ID dan alasan blacklist!');
        return;
    }

    if (window.blacklist.some(b => b.id === id)) {
        alert('ID sudah di-blacklist!');
        return;
    }

    const entry = {
        id: id,
        reason: reason,
        blacklistedDate: new Date().toLocaleString('id-ID')
    };

    window.blacklist.push(entry);
    saveData();

    idInput.value = '';
    reasonInput.value = '';

    updateAllDisplay();
    alert('ID berhasil di-blacklist!');
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE BLACKLIST
// ─────────────────────────────────────────────────────────────────────────

function deleteBlacklist(id) {
    if (confirm('Hapus dari blacklist?')) {
        window.blacklist = window.blacklist.filter(b => b.id !== id);
        saveData();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// EXPORT DATA
// ─────────────────────────────────────────────────────────────────────────

function exportData() {
    const data = {
        licenses: window.licenses,
        suspects: window.suspects,
        blacklist: window.blacklist,
        exportDate: new Date().toISOString()
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lisensi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Data berhasil di-export!');
}

// ─────────────────────────────────────────────────────────────────────────
// IMPORT DATA
// ─────────────────────────────────────────────────────────────────────────

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.licenses) window.licenses = data.licenses;
            if (data.suspects) window.suspects = data.suspects;
            if (data.blacklist) window.blacklist = data.blacklist;

            saveData();
            updateAllDisplay();
            alert('Data berhasil di-import!');
        } catch (error) {
            alert('Error: File JSON tidak valid!');
        }
    };

    reader.readAsText(file);
    event.target.value = '';
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE ALL DISPLAYS
// ─────────────────────────────────────────────────────────────────────────

function updateAllDisplay() {
    updateAcceptedList();
    updateLogList();
    updateBlacklistList();
    updateStats();
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE ACCEPTED LIST
// ─────────────────────────────────────────────────────────────────────────

function updateAcceptedList() {
    const container = document.getElementById('accList');
    
    if (window.licenses.length === 0) {
        container.innerHTML = '<div class="no-data">Belum ada ID. Tambahkan di menu TAMBAH.</div>';
        return;
    }

    let html = '';
    window.licenses.forEach(license => {
        const statusClass = license.status === 'accepted' ? 'accepted' : '';
        html += `
            <div class="id-item">
                <div class="id-info">
                    <div class="id-number">${license.id}</div>
                    <div class="id-meta">${license.owner} • ${license.addedDate}</div>
                </div>
                <div class="id-actions">
                    <button class="status-btn ${statusClass}" onclick="toggleStatus('${license.id}')">
                        ${license.status === 'accepted' ? 'DITERIMA' : 'DICABUT'}
                    </button>
                    <button class="delete-btn" onclick="deleteLicense('${license.id}')">HAPUS</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE LOG LIST
// ─────────────────────────────────────────────────────────────────────────

function updateLogList() {
    const container = document.getElementById('logList');
    
    if (window.suspects.length === 0) {
        container.innerHTML = '<div class="no-data">Log kosong.</div>';
        return;
    }

    let html = '';
    window.suspects.forEach((suspect, index) => {
        html += `
            <div class="id-item">
                <div class="id-info">
                    <div class="id-number">${suspect.id}</div>
                    <div class="id-meta">${suspect.description} • ${suspect.reportedDate}</div>
                </div>
                <div class="id-actions">
                    <button class="delete-btn" onclick="deleteSuspect(${index})">HAPUS</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE BLACKLIST
// ─────────────────────────────────────────────────────────────────────────

function updateBlacklistList() {
    const container = document.getElementById('blacklistList');
    
    if (window.blacklist.length === 0) {
        container.innerHTML = '<div class="no-data">Tidak ada yang di-blacklist.</div>';
        return;
    }

    let html = '';
    window.blacklist.forEach(entry => {
        html += `
            <div class="id-item">
                <div class="id-info">
                    <div class="id-number">${entry.id}</div>
                    <div class="id-meta">${entry.reason} • ${entry.blacklistedDate}</div>
                </div>
                <div class="id-actions">
                    <button class="delete-btn" onclick="deleteBlacklist('${entry.id}')">HAPUS</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ─────────────────────────────────────────────────────────────────────────
// UPDATE STATISTICS
// ─────────────────────────────────────────────────────────────────────────

function updateStats() {
    const total = window.licenses.length;
    const accepted = window.licenses.filter(lic => lic.status === 'accepted').length;
    const banned = window.licenses.filter(lic => lic.status === 'banned').length;

    document.getElementById('totalAcc').textContent = total;
    document.getElementById('acceptedCount').textContent = accepted;
    document.getElementById('bannedCount').textContent = banned;
}

// ═══════════════════════════════════════════════════════════════════════════
