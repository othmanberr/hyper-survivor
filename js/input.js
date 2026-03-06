// ============ USER INPUT & CONTROLS ============

const inp = { l: 0, r: 0, u: 0, d: 0, dash: 0, levUp: 0, levDown: 0 };
window.inp = inp;

// ============ MOUSE MOVEMENT ============
let _mouseDown = false;
let _mouseWorldX = 0, _mouseWorldY = 0;

window.getMouseState = function () {
    return { down: _mouseDown, x: _mouseWorldX, y: _mouseWorldY };
};

const _gameCanvas = document.getElementById('cv');
if (_gameCanvas) {
    _gameCanvas.addEventListener('mousedown', e => {
        if (e.button === 0) { _mouseDown = true; e.preventDefault(); }
    });
    _gameCanvas.addEventListener('mouseup', e => {
        if (e.button === 0) _mouseDown = false;
    });
    _gameCanvas.addEventListener('mouseleave', () => { _mouseDown = false; });
    _gameCanvas.addEventListener('mousemove', e => {
        const r = _gameCanvas.getBoundingClientRect();
        // Requires global CAM object from game.js
        const camX = typeof CAM !== 'undefined' ? CAM.x : 0;
        const camY = typeof CAM !== 'undefined' ? CAM.y : 0;
        _mouseWorldX = (e.clientX - r.left) + camX;
        _mouseWorldY = (e.clientY - r.top) + camY;
    });
    _gameCanvas.addEventListener('contextmenu', e => e.preventDefault());
}

// ============ KEYBOARD ============
window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'escape') {
        if (!document.getElementById('settings-menu').classList.contains('h')) {
            if (typeof closeSettings === 'function') closeSettings();
            return;
        }
        if (typeof togglePause === 'function') togglePause();
        return;
    }
    if (k === 'b') {
        if (G.phase === 'shop' && G.shopMode === 'persistent') {
            if (typeof closePersistentShop === 'function') closePersistentShop();
        } else {
            if (typeof openPersistentShop === 'function') openPersistentShop();
        }
        return;
    }
    if (k === 'a' || k === 'arrowleft') inp.l = 1;
    if (k === 'd' || k === 'arrowright') inp.r = 1;
    if (k === 'w' || k === 'arrowup') inp.u = 1;
    if (k === 's' || k === 'arrowdown') inp.d = 1;
    if (k === ' ') { inp.dash = 1; e.preventDefault(); }
    if (k === 'e') inp.levUp = 1;
    if (k === 'q') inp.levDown = 1;
    if (k === 'r') { if (typeof activateUltimate === 'function') activateUltimate(); }
    if (k === 't') { if (typeof toggleRadio === 'function') toggleRadio(); }
    if (k === ',') { if (typeof prevStation === 'function') prevStation(); }
    if (k === '.') { if (typeof nextStation === 'function') nextStation(); }
});

window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') inp.l = 0;
    if (k === 'd' || k === 'arrowright') inp.r = 0;
    if (k === 'w' || k === 'arrowup') inp.u = 0;
    if (k === 's' || k === 'arrowdown') inp.d = 0;
    if (k === ' ') inp.dash = 0;
    if (k === 'e') inp.levUp = 0;
    if (k === 'q') inp.levDown = 0;
});

// ============ TOUCH CONTROLS ============
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
window.isTouchDevice = isTouchDevice;

if (isTouchDevice) {
    const mc = document.getElementById('mobile-controls');
    if (mc) mc.classList.remove('h');

    // Joystick Setup
    const joystickZone = document.getElementById('joystick-zone');
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (joystickZone && joystickBase && joystickStick) {
        let joystickActive = false;
        let joystickCenter = { x: 0, y: 0 };
        let joystickId = null;

        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (joystickActive) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                joystickActive = true;
                joystickId = touch.identifier;

                const rect = joystickZone.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                joystickBase.style.left = `${x - joystickBase.offsetWidth / 2}px`;
                joystickBase.style.top = `${y - joystickBase.offsetHeight / 2}px`;
                joystickBase.style.bottom = 'auto'; // override default bottom
                joystickBase.classList.add('active');

                joystickCenter = { x: touch.clientX, y: touch.clientY };
                updateJoystickInput(touch.clientX, touch.clientY);
                break;
            }
        }, { passive: false });

        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!joystickActive) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === joystickId) {
                    updateJoystickInput(touch.clientX, touch.clientY);
                    break;
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            e.preventDefault();
            if (!joystickActive) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === joystickId) {
                    joystickActive = false;
                    joystickId = null;
                    joystickBase.classList.remove('active');
                    joystickStick.style.transform = `translate(0px, 0px)`;
                    inp.l = 0; inp.r = 0; inp.u = 0; inp.d = 0;
                    break;
                }
            }
        };

        joystickZone.addEventListener('touchend', endJoystick, { passive: false });
        joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });

        function updateJoystickInput(clientX, clientY) {
            const maxDist = joystickBase.offsetWidth / 2;
            let dx = clientX - joystickCenter.x;
            let dy = clientY - joystickCenter.y;
            const dist = Math.hypot(dx, dy);

            const stickDist = Math.min(dist, maxDist);
            const angle = Math.atan2(dy, dx);
            const stickX = Math.cos(angle) * stickDist;
            const stickY = Math.sin(angle) * stickDist;

            joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

            if (dist < 10) {
                inp.l = 0; inp.r = 0; inp.u = 0; inp.d = 0;
                return;
            }

            inp.l = stickX < -maxDist * 0.2 ? 1 : 0;
            inp.r = stickX > maxDist * 0.2 ? 1 : 0;
            inp.u = stickY < -maxDist * 0.2 ? 1 : 0;
            inp.d = stickY > maxDist * 0.2 ? 1 : 0;
        }
    }

    // Action Buttons
    const btnDash = document.getElementById('btn-mobile-dash');
    const btnShop = document.getElementById('btn-mobile-shop');
    const btnUlt = document.getElementById('btn-mobile-ult');

    const ab = document.getElementById('action-buttons');
    if (ab) ab.addEventListener('touchstart', e => e.preventDefault(), { passive: false });

    // Dash
    if (btnDash) {
        btnDash.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btnDash.classList.add('active');
            inp.dash = 1;
        }, { passive: false });
        btnDash.addEventListener('touchend', (e) => {
            e.preventDefault();
            btnDash.classList.remove('active');
            inp.dash = 0;
        }, { passive: false });
    }

    // Shop
    if (btnShop) {
        btnShop.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btnShop.classList.add('active');
            if (G.phase === 'shop' && G.shopMode === 'persistent') {
                if (typeof closePersistentShop === 'function') closePersistentShop();
            } else {
                if (typeof openPersistentShop === 'function') openPersistentShop();
            }
        }, { passive: false });
        btnShop.addEventListener('touchend', (e) => {
            e.preventDefault();
            btnShop.classList.remove('active');
        }, { passive: false });
    }

    // Ultimate
    if (btnUlt) {
        btnUlt.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btnUlt.classList.add('active');
            if (typeof activateUltimate === 'function') activateUltimate();
        }, { passive: false });
        btnUlt.addEventListener('touchend', (e) => {
            e.preventDefault();
            btnUlt.classList.remove('active');
        }, { passive: false });
    }
}
