(function () {
    const URL_FRASE = 'https://www.positive-api.online/phrase/esp';
    const FRASES_RESPALDO = [
        'Cada día es una buena oportunidad para ordenar tu negocio.',
        'Un buen control hoy es tranquilidad mañana.',
        'Los pequeños avances de cada día construyen grandes resultados.',
        'Lo que se mide, se puede mejorar.'
    ];

    const saludo = document.getElementById('saludo-texto');
    const frase = document.getElementById('saludo-frase');
    const btnOtra = document.getElementById('saludo-otra');
    const icono = document.getElementById('saludo-icono');
    if (!saludo || !frase || !btnOtra) return;

    function saludoSegunHora() {
        const hora = new Date().getHours();
        if (hora >= 5 && hora < 12) return { texto: '¡Buen día!', icono: 'fa-solid fa-sun' };
        if (hora >= 12 && hora < 20) return { texto: '¡Buenas tardes!', icono: 'fa-solid fa-cloud-sun' };
        return { texto: '¡Buenas noches!', icono: 'fa-solid fa-moon' };
    }

    function mostrarFrase(texto) {
        frase.textContent = '“' + texto + '”';
    }

    function fraseDeRespaldo() {
        return FRASES_RESPALDO[Math.floor(Math.random() * FRASES_RESPALDO.length)];
    }

    async function cargarFrase() {
        btnOtra.disabled = true;
        icono.classList.add('animate-spin');
        const control = new AbortController();
        const limite = setTimeout(function () { control.abort(); }, 6000);
        try {
            const respuesta = await fetch(URL_FRASE, { cache: 'no-store', signal: control.signal });
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            const datos = await respuesta.json();
            if (!datos || typeof datos.text !== 'string' || !datos.text.trim()) throw new Error('Respuesta sin texto');
            mostrarFrase(datos.text.trim());
        } catch (e) {
            // Sin conexión o API caída: se muestra una frase propia en lugar de dejar el espacio vacío
            mostrarFrase(fraseDeRespaldo());
        } finally {
            clearTimeout(limite);
            icono.classList.remove('animate-spin');
            btnOtra.disabled = false;
        }
    }

    const s = saludoSegunHora();
    saludo.textContent = s.texto;
    const contenedorIcono = document.getElementById('saludo-hora');
    const iconoHora = document.createElement('i');
    iconoHora.className = s.icono;
    contenedorIcono.replaceChildren(iconoHora);
    btnOtra.addEventListener('click', cargarFrase);
    cargarFrase();
})();
