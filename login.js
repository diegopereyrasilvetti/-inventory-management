const form = document.getElementById('form-login');
const mensaje = document.getElementById('mensaje-login');
const password = document.getElementById('password');
const toggle = document.getElementById('toggle-password');

toggle.addEventListener('click', function () {
    const oculto = password.type === 'password';
    password.type = oculto ? 'text' : 'password';
    toggle.setAttribute('aria-label', oculto ? 'Ocultar contraseña' : 'Mostrar contraseña');
    toggle.firstElementChild.className = oculto ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
});

form.addEventListener('submit', function (e) {
    e.preventDefault();
    mensaje.classList.remove('hidden');
    if (!form.checkValidity()) {
        mensaje.textContent = 'Completá un email válido y tu contraseña.';
        return;
    }
    mensaje.textContent = 'El inicio de sesión todavía no está disponible.';
});
