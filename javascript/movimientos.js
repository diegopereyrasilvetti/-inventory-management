(function () {
    const aviso = document.getElementById('mov-aviso');
    if (!aviso) return;

    let temporizador;

    function mostrarAviso() {
        aviso.classList.remove('hidden');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { aviso.classList.add('hidden'); }, 3500);
    }

    document.querySelectorAll('#movimientos [data-proximamente]').forEach(function (el) {
        const evento = el.tagName === 'SELECT' ? 'change' : 'click';
        el.addEventListener(evento, function () {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            mostrarAviso();
        });
    });
})();
