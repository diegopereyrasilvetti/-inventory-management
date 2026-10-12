(function () {
    const aviso = document.getElementById('prov-aviso');
    if (!aviso) return;

    let temporizador;

    function mostrarAviso() {
        aviso.classList.remove('hidden');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { aviso.classList.add('hidden'); }, 3500);
    }

    document.querySelectorAll('#proveedores [data-proximamente]').forEach(function (el) {
        const evento = el.tagName === 'INPUT' ? 'input' : 'click';
        el.addEventListener(evento, function () {
            if (el.tagName === 'INPUT') el.value = '';
            mostrarAviso();
        });
    });
})();
