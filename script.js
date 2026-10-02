// ═══════════════════════════════════════════════════════════════════════════
// SUMMITKIT LISENSI STUDIO - MAIN SCRIPT v2 (JSONBin auto-sync)
// Perubahan: payload publik minimal, tarik data bin sebelum sync (anti-timpa),
// escape HTML, validasi ID angka, showSection tanpa global event.
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'summitkit_licenses';
const SUSPECT_KEY = 'summitkit_suspects';
const BLACKLIST_KEY = 'summitkit_blacklist';
const GITHUB_SETTINGS_KEY = 'summitkit_github_settings';
const DIRTY_KEY = 'summitkit_dirty'; // '1' = ada perubahan lokal yang belum sampai ke bin

let pulled = false; // true setelah data bin berhasil diambil di sesi ini

// ─────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isValidId(id) {
    return /^\d{5,}$/.test(id);
}

function setSync(text, color) {
    const el = document.getElementById('syncIndicator');
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
}

// ─────────────────────────────────────────────────────────────────────────
// INITIALIZE APP
// ─────────────────────────────────────────────────────────────────────────

window.onload = function() {
    loadData();
    updateAllDisplay();
    fillGithubSettingsForm();
    updateGithubStatus();
    updateSyncIndicatorIdle();
    initialPull();
};

function updateSyncIndicatorIdle() {
    const settings = loadGithubSettings();
    if (settings && settings.masterKey) {
        setSync('Auto-sync AKTIF (tersimpan di perangkat ini)', '#66ff99');
    } else {
        setSync('Auto-sync belum disetel (lihat menu SETTINGS)', '#888888');
    }
}

async function initialPull() {
    const settings = loadGithubSettings();
    if (!settings || !settings.masterKey) return;
    setSync('Mengambil data dari JSONBin...', '#ffcc00');
    try {
        await pullFromBin();
        setSync('Data bin termuat \u2713 (' + new Date().toLocaleTimeString('id-ID') + ')', '#66ff99');
    } catch (err) {
        console.error('Pull error:', err);
        setSync('GAGAL ambil data bin: ' + err.message + ' (sync ditahan, reload halaman)', '#ff6666');
    }
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION NAVIGATION
// ─────────────────────────────────────────────────────────────────────────

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    const btn = document.querySelector('.nav-btn[onclick*="\'' + sectionId + '\'"]');
    if (btn) btn.classList.add('active');
    updateAllDisplay();
    if (sectionId === 'settings') {
        fillGithubSettingsForm();
        updateGithubStatus();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────────────

function readArray(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function loadData() {
    window.licenses = readArray(STORAGE_KEY);
    window.suspects = readArray(SUSPECT_KEY);
    window.blacklist = readArray(BLACKLIST_KEY);
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

function persistAndSync() {
    localStorage.setItem(DIRTY_KEY, '1');
    saveData();
    syncToGithub();
}

// ─────────────────────────────────────────────────────────────────────────
// LICENSE IDs
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
    if (!isValidId(id)) {
        alert('ID harus berupa angka (minimal 5 digit)!');
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
    alert('ID berhasil ditambahkan! Sedang sinkron ke JSONBin...');
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
// SUSPECT / LOG PENCURI (hanya lokal, TIDAK dikirim ke bin publik)
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

    saveData();

    idInput.value = '';
    descInput.value = '';
    updateAllDisplay();
    alert('Pencuri dicatat (hanya di perangkat ini). LOG PENCURI tidak otomatis blokir, pindahkan ke BLACKLIST kalau mau diblokir. Gunakan EXPORT DATA untuk backup.');
}

function deleteSuspect(index) {
    if (confirm('Hapus laporan ini?')) {
        window.suspects.splice(index, 1);
        saveData();
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
    if (!isValidId(id)) {
        alert('ID harus berupa angka (minimal 5 digit)!');
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
    alert('ID berhasil di-blacklist! Sedang sinkron ke JSONBin...');
}

function deleteBlacklist(id) {
    if (confirm('Hapus dari blacklist?')) {
        window.blacklist = window.blacklist.filter(b => b.id !== id);
        persistAndSync();
        updateAllDisplay();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// EXPORT / IMPORT
// ─────────────────────────────────────────────────────────────────────────

function exportData() {
    const data = {
        licenses: window.licenses,
        suspects: window.suspects,
        blacklist: window.blacklist,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
            if (Array.isArray(data.licenses)) {
                window.licenses = data.licenses.filter(l => l && isValidId(String(l.id))).map(l => ({
                    id: String(l.id),
                    owner: String(l.owner || 'N/A'),
                    notes: String(l.notes || 'N/A'),
                    status: l.status === 'accepted' ? 'accepted' : 'banned',
                    addedDate: String(l.addedDate || new Date().toLocaleString('id-ID'))
                }));
            }
            if (Array.isArray(data.suspects)) window.suspects = data.suspects;
            if (Array.isArray(data.blacklist)) {
                window.blacklist = data.blacklist.filter(b => b && isValidId(String(b.id))).map(b => ({
                    id: String(b.id),
                    reason: String(b.reason || 'N/A'),
                    blacklistedDate: String(b.blacklistedDate || new Date().toLocaleString('id-ID'))
                }));
            }
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
// JSONBIN SETTINGS
// ─────────────────────────────────────────────────────────────────────────

function fillGithubSettingsForm() {
    const settings = loadGithubSettings();
    if (!settings) return;
    const binEl = document.getElementById('ghBinId');
    if (binEl) binEl.value = settings.binId || '';
}

function saveGithubSettings() {
    const binId = document.getElementById('ghBinId').value.trim();
    const keyInput = document.getElementById('ghToken');
    const newKey = keyInput.value.trim();

    if (!binId) {
        alert('Bin ID wajib diisi!');
        return;
    }

    const existing = loadGithubSettings();
    const masterKey = newKey || (existing ? existing.masterKey : '');

    if (!masterKey) {
        alert('Master Key wajib diisi minimal sekali!');
        return;
    }

    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify({ binId, masterKey }));
    keyInput.value = '';
    pulled = false;
    alert('Pengaturan tersimpan di perangkat ini.');
    updateGithubStatus();
    updateSyncIndicatorIdle();
    initialPull();
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
    if (confirm('Hapus pengaturan tersimpan di perangkat ini? Auto-sync akan berhenti.')) {
        localStorage.removeItem(GITHUB_SETTINGS_KEY);
        pulled = false;
        updateGithubStatus();
        fillGithubSettingsForm();
        updateSyncIndicatorIdle();
    }
}

function updateGithubStatus() {
    const el = document.getElementById('ghStatus');
    if (!el) return;
    const settings = loadGithubSettings();
    if (settings && settings.masterKey) {
        el.textContent = `AUTO-SYNC AKTIF -> Bin ID: ${settings.binId}`;
        el.style.color = '#66ff99';
    } else {
        el.textContent = 'AUTO-SYNC BELUM DISETEL. Data cuma tersimpan lokal di perangkat ini.';
        el.style.color = '#ff6666';
    }
}

// ─────────────────────────────────────────────────────────────────────────
// JSONBIN: TARIK DATA (anti-timpa) & KIRIM DATA
// ─────────────────────────────────────────────────────────────────────────

// Bin = sumber kebenaran untuk daftar ID/blacklist & status.
// Kalau ada perubahan lokal yang belum terkirim (dirty), data lokal ikut dipertahankan.
async function pullFromBin() {
    const settings = loadGithubSettings();
    if (!settings || !settings.masterKey) return;

    const resp = await fetch(`https://api.jsonbin.io/v3/b/${settings.binId}/latest`, {
        headers: { 'X-Master-Key': settings.masterKey }
    });
    if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${resp.status}`);
    }
    const json = await resp.json();
    const rec = (json && json.record) || {};
    const remoteIds = Array.isArray(rec.ids) ? rec.ids : [];
    const remoteBl = Array.isArray(rec.blacklist) ? rec.blacklist : [];
    const dirty = localStorage.getItem(DIRTY_KEY) === '1';
    const now = new Date().toLocaleString('id-ID');

    const localLic = new Map(window.licenses.map(l => [l.id, l]));
    const mergedLic = [];
    const seenLic = new Set();
    remoteIds.forEach(r => {
        if (!r) return;
        const id = String(r.id);
        if (!isValidId(id) || seenLic.has(id)) return;
        seenLic.add(id);
        const loc = localLic.get(id);
        const remoteStatus = r.status === 'accepted' ? 'accepted' : 'banned';
        mergedLic.push({
            id: id,
            owner: (loc && loc.owner) || r.owner || 'N/A',
            notes: (loc && loc.notes) || r.notes || 'N/A',
            status: (dirty && loc) ? loc.status : remoteStatus,
            addedDate: (loc && loc.addedDate) || r.addedDate || now
        });
    });
    if (dirty) {
        window.licenses.forEach(l => { if (!seenLic.has(l.id)) mergedLic.push(l); });
    }

    const localBl = new Map(window.blacklist.map(b => [b.id, b]));
    const mergedBl = [];
    const seenBl = new Set();
    remoteBl.forEach(r => {
        if (!r) return;
        const id = String(r.id);
        if (!isValidId(id) || seenBl.has(id)) return;
        seenBl.add(id);
        const loc = localBl.get(id);
        mergedBl.push({
            id: id,
            reason: (loc && loc.reason) || r.reason || 'N/A',
            blacklistedDate: (loc && loc.blacklistedDate) || r.blacklistedDate || now
        });
    });
    if (dirty) {
        window.blacklist.forEach(b => { if (!seenBl.has(b.id)) mergedBl.push(b); });
    }

    window.licenses = mergedLic;
    window.blacklist = mergedBl;
    saveData();
    pulled = true;
    updateAllDisplay();

    if (dirty) await syncToGithub();
}

async function syncToGithub() {
    const settings = loadGithubSettings();

    if (!settings || !settings.masterKey) {
        setSync('Auto-sync belum disetel (lihat menu SETTINGS)', '#888888');
        return;
    }
    if (!pulled) {
        setSync('Sync ditahan: data bin belum berhasil diambil. Reload halaman.', '#ff6666');
        return;
    }

    // Payload PUBLIK: hanya yang dibutuhkan Roblox. Owner/notes/suspects tetap lokal.
    const payload = {
        ids: window.licenses.map(l => ({ id: l.id, status: l.status })),
        blacklist: window.blacklist.map(b => ({ id: b.id })),
        lastUpdated: new Date().toISOString()
    };

    setSync('Menyinkronkan...', '#ffcc00');

    try {
        const putResp = await fetch(`https://api.jsonbin.io/v3/b/${settings.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': settings.masterKey
            },
            body: JSON.stringify(payload)
        });

        if (!putResp.ok) {
            const errData = await putResp.json().catch(() => ({}));
            throw new Error(errData.message || `Gagal update (HTTP ${putResp.status})`);
        }

        localStorage.removeItem(DIRTY_KEY);
        setSync('Tersinkron \u2713 (' + new Date().toLocaleTimeString('id-ID') + ')', '#66ff99');
    } catch (err) {
        console.error('Sync error:', err);
        setSync('GAGAL sync: ' + err.message, '#ff6666');
        alert('Gagal sync otomatis: ' + err.message + '\n\nData tetap aman tersimpan lokal (akan dicoba lagi saat ada perubahan berikutnya), dan kamu masih bisa EXPORT DATA.');
    }
}

// ─────────────────────────────────────────────────────────────────────────
// RENDER
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
                    <div class="id-number">${esc(license.id)}</div>
                    <div class="id-meta">${esc(license.owner)} \u2022 ${esc(license.addedDate)}</div>
                </div>
                <div class="id-actions">
                    <button class="status-btn ${statusClass}" data-id="${esc(license.id)}" onclick="toggleStatus(this.dataset.id)">
                        ${license.status === 'accepted' ? 'DITERIMA' : 'DICABUT'}
                    </button>
                    <button class="delete-btn" data-id="${esc(license.id)}" onclick="deleteLicense(this.dataset.id)">HAPUS</button>
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
                    <div class="id-number">${esc(suspect.id)}</div>
                    <div class="id-meta">${esc(suspect.description)} \u2022 ${esc(suspect.reportedDate)}</div>
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
                    <div class="id-number">${esc(entry.id)}</div>
                    <div class="id-meta">${esc(entry.reason)} \u2022 ${esc(entry.blacklistedDate)}</div>
                </div>
                <div class="id-actions">
                    <button class="delete-btn" data-id="${esc(entry.id)}" onclick="deleteBlacklist(this.dataset.id)">HAPUS</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateStats() {
    const total = window.licenses.length;
    const accepted = window.licenses.filter(lic => lic.status === 'accepted').length;
    const banned = window.licenses.filter(lic => lic.status !== 'accepted').length;
    document.getElementById('totalAcc').textContent = total;
    document.getElementById('acceptedCount').textContent = accepted;
    document.getElementById('bannedCount').textContent = banned;
}

// ═══════════════════════════════════════════════════════════════════════════
