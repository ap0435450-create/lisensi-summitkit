// ═══════════════════════════════════════════════════════════════════════════
// SUMMITKIT LISENSI STUDIO - MAIN SCRIPT (dengan Auto-Sync GitHub)
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'summitkit_licenses';
const SUSPECT_KEY = 'summitkit_suspects';
const BLACKLIST_KEY = 'summitkit_blacklist';
const GITHUB_SETTINGS_KEY = 'summitkit_github_settings';

// ─────────────────────────────────────────────────────────────────────────
// INITIALIZE APP
// ─────────────────────────────────────────────────────────────────────────

window.onload = function() {
    loadData();
    updateAllDisplay();
    fillGithubSettingsForm();
    updateGithubStatus();
};

// ─────────────────────────────────────────────────────────────────────────
// SECTION NAVIGATION
// ─────────────────────────────────────────────────────────────────────────

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
    updateAllDisplay();
    if (sectionId === 'settings') {
        fillGithubSettingsForm();
        updateGithubStatus();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        window.licenses = data ? JSON.parse(data) : [];
    } catch (e) {
        window.licenses = [];
    }
    try {
        const suspects = localStorage.getItem(SUSPECT_KEY);
        window.suspects = suspects ? JSON.parse(suspects) : [];
    } catch (e) {
        window.suspects = [];
    }
    try {
        const blacklist = localStorage.getItem(BLACKLIST_KEY);
        window.blacklist = blacklist ? JSON.parse(blacklist) : [];
    } catch (e) {
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
        alert('Gagal menyimpan data secara lokal!');
    }
}

// Dipanggil setiap kali ada perubahan data: simpan lokal + sync ke GitHub
function persistAndSync() {
    saveData();
    syncToGithub();
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

    if (!id) {
        alert('Masukkan ID terlebih dahulu!');
        idInput.focus();
        return;
    }
    if (isNaN(id) || id.length < 5) {
        alert('ID harus berupa angka yang valid!');
        return;
    }
    if (window.licenses.some(lic => lic.id === id)) {
        alert('ID sudah ada di database!');
        return;
    }

    window.licenses.push({
        id: id,
        owner: owner || 'N/A',
        notes: notes || 'N/A',
        status: 'accepted',
        addedDate: new Date().toLocaleString('id-ID')
    });

    persistAndSync();

    idInput.value = '';
    ownerInput.value = '';
    notesInput.value = '';

    updateAllDisplay();
    alert('ID berhasil ditambahkan! Sedang sinkron ke GitHub...');
}

function toggleStatus(id) {
    const license = window.licenses.find(lic => lic.id === id);
    if (license) {
        license.status = license.status === 'accepted' ? 'banned' : 'accepted';
        persistAndSync();
        updateAllDisplay();
    }
}

function deleteLicense(id) {
    if (confirm('Yakin ingin menghapus ID ini?')) {
        window.licenses = window.licenses.filter(lic => lic.id !== id);
        persistAndSync();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SUSPECT / LOG PENCURI
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

    window.suspects.push({
        id: id,
        description: desc,
        reportedDate: new Date().toLocaleString('id-ID')
    });

    persistAndSync();

    idInput.value = '';
    descInput.value = '';
    updateAllDisplay();
    alert('Pencuri berhasil dicatat! (Catatan: LOG PENCURI tidak otomatis blokir, pindahkan ke BLACKLIST kalau mau diblokir)');
}

function deleteSuspect(index) {
    if (confirm('Hapus laporan ini?')) {
        window.suspects.splice(index, 1);
        persistAndSync();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// BLACKLIST
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

    window.blacklist.push({
        id: id,
        reason: reason,
        blacklistedDate: new Date().toLocaleString('id-ID')
    });

    persistAndSync();

    idInput.value = '';
    reasonInput.value = '';
    updateAllDisplay();
    alert('ID berhasil di-blacklist! Sedang sinkron ke GitHub...');
}

function deleteBlacklist(id) {
    if (confirm('Hapus dari blacklist?')) {
        window.blacklist = window.blacklist.filter(b => b.id !== id);
        persistAndSync();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// EXPORT / IMPORT (tetap ada sebagai backup manual)
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
            persistAndSync();
            updateAllDisplay();
            alert('Data berhasil di-import & disinkronkan!');
        } catch (error) {
            alert('Error: File JSON tidak valid!');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ─────────────────────────────────────────────────────────────────────────
// GITHUB AUTO-SYNC
// ─────────────────────────────────────────────────────────────────────────

function fillGithubSettingsForm() {
    const settings = loadGithubSettings();
    if (!settings) return;
    const ownerEl = document.getElementById('ghOwner');
    const repoEl = document.getElementById('ghRepo');
    const pathEl = document.getElementById('ghPath');
    if (ownerEl) ownerEl.value = settings.owner || '';
    if (repoEl) repoEl.value = settings.repo || '';
    if (pathEl) pathEl.value = settings.path || 'lisensi-data.json';
    // Token sengaja TIDAK diisi ulang ke form (biar tidak nampang di layar)
}

function saveGithubSettings() {
    const owner = document.getElementById('ghOwner').value.trim();
    const repo = document.getElementById('ghRepo').value.trim();
    const path = document.getElementById('ghPath').value.trim() || 'lisensi-data.json';
    const tokenInput = document.getElementById('ghToken');
    const newToken = tokenInput.value.trim();

    if (!owner || !repo) {
        alert('Owner dan Repo wajib diisi!');
        return;
    }

    const existing = loadGithubSettings();
    const token = newToken || (existing ? existing.token : '');

    if (!token) {
        alert('Token wajib diisi minimal sekali!');
        return;
    }

    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify({ owner, repo, path, token }));
    tokenInput.value = '';
    alert('Pengaturan GitHub tersimpan di perangkat ini.');
    updateGithubStatus();
}

function loadGithubSettings() {
    try {
        const raw = localStorage.getItem(GITHUB_SETTINGS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function clearGithubSettings() {
    if (confirm('Hapus token GitHub yang tersimpan di perangkat ini? Auto-sync akan berhenti.')) {
        localStorage.removeItem(GITHUB_SETTINGS_KEY);
        updateGithubStatus();
        fillGithubSettingsForm();
    }
}

function updateGithubStatus() {
    const el = document.getElementById('ghStatus');
    if (!el) return;
    const settings = loadGithubSettings();
    if (settings && settings.token) {
        el.textContent = `AUTO-SYNC AKTIF -> ${settings.owner}/${settings.repo}/${settings.path}`;
        el.style.color = '#66ff99';
    } else {
        el.textContent = 'AUTO-SYNC BELUM DISETEL. Data cuma tersimpan lokal di HP ini.';
        el.style.color = '#ff6666';
    }
}

async function syncToGithub() {
    const settings = loadGithubSettings();
    const syncEl = document.getElementById('syncIndicator');

    if (!settings || !settings.token) {
        if (syncEl) {
            syncEl.textContent = 'Auto-sync belum disetel (lihat menu SETTINGS)';
            syncEl.style.color = '#888888';
        }
        return;
    }

    const payload = {
        ids: window.licenses,
        suspects: window.suspects,
        blacklist: window.blacklist,
        lastUpdated: new Date().toISOString()
    };
    const jsonString = JSON.stringify(payload, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));
    const apiUrl = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}`;

    if (syncEl) {
        syncEl.textContent = 'Menyinkronkan ke GitHub...';
        syncEl.style.color = '#ffcc00';
    }

    try {
        const getResp = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${settings.token}`,
                'Accept': 'application/vnd.github+json'
            }
        });

        let sha = null;
        if (getResp.ok) {
            const getData = await getResp.json();
            sha = getData.sha;
        } else if (getResp.status !== 404) {
            const errData = await getResp.json().catch(() => ({}));
            throw new Error(errData.message || `Gagal ambil data (HTTP ${getResp.status})`);
        }

        const body = {
            message: `Update lisensi via web - ${new Date().toLocaleString('id-ID')}`,
            content: contentBase64
        };
        if (sha) body.sha = sha;

        const putResp = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${settings.token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!putResp.ok) {
            const errData = await putResp.json().catch(() => ({}));
            throw new Error(errData.message || `Gagal update (HTTP ${putResp.status})`);
        }

        if (syncEl) {
            syncEl.textContent = 'Tersinkron ke GitHub \u2713 (' + new Date().toLocaleTimeString('id-ID') + ')';
            syncEl.style.color = '#66ff99';
        }
    } catch (err) {
        console.error('Sync error:', err);
        if (syncEl) {
            syncEl.textContent = 'GAGAL sync ke GitHub: ' + err.message;
            syncEl.style.color = '#ff6666';
        }
        alert('Gagal sync otomatis ke GitHub: ' + err.message + '\n\nData tetap aman tersimpan lokal, dan kamu masih bisa EXPORT DATA lalu update manual.');
    }
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
                    <div class="id-meta">${license.owner} \u2022 ${license.addedDate}</div>
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
                    <div class="id-meta">${suspect.description} \u2022 ${suspect.reportedDate}</div>
                </div>
                <div class="id-actions">
                    <button class="delete-btn" onclick="deleteSuspect(${index})">HAPUS</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

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
                    <div class="id-meta">${entry.reason} \u2022 ${entry.blacklistedDate}</div>
                </div>
                <div class="id-actions">
                    <button class="delete-btn" onclick="deleteBlacklist('${entry.id}')">HAPUS</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateStats() {
    const total = window.licenses.length;
    const accepted = window.licenses.filter(lic => lic.status === 'accepted').length;
    const banned = window.licenses.filter(lic => lic.status === 'banned').length;
    document.getElementById('totalAcc').textContent = total;
    document.getElementById('acceptedCount').textContent = accepted;
    document.getElementById('bannedCount').textContent = banned;
}

// ═══════════════════════════════════════════════════════════════════════════
