// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD PROTECTION - LOGIN FORM & SESSION
// ═══════════════════════════════════════════════════════════════════════════

// ⚠️  UBAH PASSWORD INI KE PASSWORD KAMU!
// Change this to your desired password
const CORRECT_PASSWORD = "password123";

// Session keys
const SESSION_KEY = 'summitkit_session';
const REMEMBER_KEY = 'summitkit_remember';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// ─────────────────────────────────────────────────────────────────────────
// CHECK SESSION ON PAGE LOAD
// ─────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    if (!isSessionValid()) {
        showLoginForm();
    } else {
        hideLoginForm();
    }
});

// ─────────────────────────────────────────────────────────────────────────
// CHECK IF SESSION IS VALID
// ─────────────────────────────────────────────────────────────────────────

function isSessionValid() {
    const session = localStorage.getItem(SESSION_KEY);
    
    if (!session) {
        return false;
    }

    try {
        const sessionData = JSON.parse(session);
        const now = new Date().getTime();
        
        // Check if session expired
        if (now > sessionData.expiryTime) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────
// CREATE LOGIN FORM
// ─────────────────────────────────────────────────────────────────────────

function showLoginForm() {
    // Remove existing login if any
    const existing = document.getElementById('login-overlay');
    if (existing) existing.remove();

    const loginHTML = `
        <div id="login-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Courier New', monospace;
        ">
            <div style="
                border: 2px solid #ffffff;
                padding: 40px 30px;
                background-color: #0a0a0a;
                text-align: center;
                max-width: 350px;
                width: 90%;
            ">
                <h1 style="
                    font-size: 18px;
                    color: #ffffff;
                    margin-bottom: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    font-weight: normal;
                ">
                    SUMMITKIT
                </h1>
                
                <h2 style="
                    font-size: 14px;
                    color: #ffffff;
                    margin-bottom: 25px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    font-weight: normal;
                ">
                    🔐 PASSWORD REQUIRED
                </h2>

                <input 
                    type="password" 
                    id="login-password" 
                    placeholder="Masukkan Password..." 
                    style="
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 15px;
                        background-color: #000000;
                        border: 1px solid #555555;
                        color: #ffffff;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                    "
                    onkeypress="if(event.key === 'Enter') verifyPassword()"
                >

                <button 
                    onclick="verifyPassword()" 
                    style="
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 12px;
                        background-color: #000000;
                        border: 1px solid #ffffff;
                        color: #ffffff;
                        cursor: pointer;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        transition: all 0.2s;
                    "
                    onmouseover="this.style.backgroundColor='#ffffff'; this.style.color='#000000'"
                    onmouseout="this.style.backgroundColor='#000000'; this.style.color='#ffffff'"
                >
                    ✓ BUKA
                </button>

                <label style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 11px;
                    color: #888888;
                    cursor: pointer;
                ">
                    <input 
                        type="checkbox" 
                        id="login-remember" 
                        style="cursor: pointer; width: 16px; height: 16px;"
                    >
                    Ingat password 24 jam
                </label>

                <div id="login-error" style="
                    margin-top: 15px;
                    color: #ff6666;
                    font-size: 11px;
                    display: none;
                ">
                    ❌ Password salah! Coba lagi.
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loginHTML);

    // Focus password input
    setTimeout(() => {
        const passwordInput = document.getElementById('login-password');
        if (passwordInput) {
            passwordInput.focus();
        }
    }, 100);
}

// ─────────────────────────────────────────────────────────────────────────
// HIDE LOGIN FORM
// ─────────────────────────────────────────────────────────────────────────

function hideLoginForm() {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
        loginOverlay.remove();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// VERIFY PASSWORD
// ─────────────────────────────────────────────────────────────────────────

function verifyPassword() {
    const passwordInput = document.getElementById('login-password');
    const rememberCheckbox = document.getElementById('login-remember');
    const errorDiv = document.getElementById('login-error');
    
    const password = passwordInput.value;

    if (password === CORRECT_PASSWORD) {
        // Password correct
        const remember = rememberCheckbox.checked;
        createSession(remember);
        hideLoginForm();
    } else {
        // Wrong password
        errorDiv.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// ─────────────────────────────────────────────────────────────────────────
// CREATE SESSION
// ─────────────────────────────────────────────────────────────────────────

function createSession(remember) {
    const now = new Date().getTime();
    const expiryTime = remember ? 
        now + (24 * 60 * 60 * 1000) :  // 24 hours
        now + (60 * 60 * 1000);         // 1 hour (this session)

    const sessionData = {
        createdAt: now,
        expiryTime: expiryTime,
        remember: remember
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

// ─────────────────────────────────────────────────────────────────────────
// LOGOUT SESSION
// ─────────────────────────────────────────────────────────────────────────

function logoutSession() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        
        // Reload page to show login
        location.reload();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
