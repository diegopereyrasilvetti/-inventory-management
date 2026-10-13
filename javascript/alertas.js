(function () {
    const lista = document.getElementById('alertas-lista');
    const vacio = document.getElementById('alertas-vacio');
    const vacioTexto = document.getElementById('alertas-vacio-texto');
    const subtitulo = document.getElementById('alertas-subtitulo');
    const mensaje = document.getElementById('alertas-mensaje');
    const filtros = document.querySelectorAll('#alertas-filtros button');
    if (!lista || typeof productos === 'undefined') return;

    let filtro = 'todas';
    let temporizador;

    function el(etiqueta, clases, texto) {
        const nodo = document.createElement(etiqueta);
        if (clases) nodo.className = clases;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function plural(n) {
        return n + (n === 1 ? ' unidad' : ' unidades');
    }

    function avisar(texto) {
        mensaje.textContent = texto;
        mensaje.classList.remove('hidden');
        clearTimeout(temporizador);
        temporizador = setTimeout(function () { mensaje.classList.add('hidden'); }, 5000);
    }

    /* Proveedor del producto: se busca en el catálogo por código/SKU y luego en la lista de proveedores */
    function proveedorDe(p) {
        const catalogo = typeof window.obtenerCatalogo === 'function' ? window.obtenerCatalogo() : [];
        const ficha = catalogo.find(function (c) { return String(c.sku).toLowerCase() === String(p.codigo).toLowerCase(); });
        if (!ficha || !ficha.proveedor) return { nombre: '', datos: null };
        const todos = typeof window.obtenerProveedores === 'function' ? window.obtenerProveedores() : [];
        const datos = todos.find(function (x) { return x.nombre.toLowerCase() === ficha.proveedor.toLowerCase(); }) || null;
        return { nombre: ficha.proveedor, datos: datos };
    }

    function sugerido(p) {
        return Math.max(1, p.minimo * 2 - p.stock);
    }

    function boton(clases, icono, texto) {
        const b = el('a', clases);
        if (icono) b.appendChild(el('i', icono + ' text-[11px]'));
        b.appendChild(document.createTextNode(' ' + texto));
        return b;
    }

    function crearTarjeta(p) {
        const estado = estadoDe(p);
        const agotado = estado === 'agotado';
        const li = el('li', 'flex flex-col gap-4 rounded-2xl border border-(--borde) bg-(--superficie) p-4 shadow-[0_2px_8px_rgba(59,42,32,0.04)] sm:p-5');

        // Encabezado: nombre, código y estado
        const cab = el('div', 'flex items-start justify-between gap-3');
        const quien = el('div', 'min-w-0');
        quien.appendChild(el('p', 'break-words text-base font-semibold text-(--texto)', p.nombre));
        quien.appendChild(el('p', 'break-all font-mono text-xs text-(--texto-suave)', p.codigo));
        cab.appendChild(quien);
        cab.appendChild(el('span', 'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ' + ESTADOS[estado].clases, agotado ? 'Sin stock' : 'Stock bajo'));
        li.appendChild(cab);

        // Descripción y barra de avance hacia el mínimo
        const detalle = el('div');
        const texto = agotado
            ? 'No hay stock y se necesitan mínimo ' + plural(p.minimo) + '.'
            : (p.stock === 1 ? 'Queda solo 1 unidad' : 'Hay pocos (' + plural(p.stock) + ')') + ' y se necesitan mínimo ' + plural(p.minimo) + '.';
        detalle.appendChild(el('p', 'text-sm text-(--texto)', texto));
        const barra = el('div', 'mt-2 h-2 w-full overflow-hidden rounded-full bg-(--fondo) ring-1 ring-(--borde)');
        barra.setAttribute('role', 'progressbar');
        barra.setAttribute('aria-label', 'Stock actual respecto del mínimo de ' + p.nombre);
        barra.setAttribute('aria-valuemin', '0');
        barra.setAttribute('aria-valuemax', String(p.minimo));
        barra.setAttribute('aria-valuenow', String(Math.min(p.stock, p.minimo)));
        const relleno = el('div', 'h-full rounded-full ' + (agotado ? 'bg-(--viz-gris)' : 'bg-(--viz-naranja)'));
        relleno.style.width = (p.minimo > 0 ? Math.min(100, p.stock / p.minimo * 100) : 0) + '%';
        barra.appendChild(relleno);
        detalle.appendChild(barra);
        detalle.appendChild(el('p', 'mt-1 text-xs text-(--texto-suave)', p.stock + ' de ' + p.minimo + ' unidades mínimas'));
        li.appendChild(detalle);

        // Acción 1: reponer stock
        const form = el('form', 'flex flex-col gap-2 rounded-xl bg-(--fondo) p-3');
        form.dataset.id = p.id;
        form.setAttribute('novalidate', '');
        form.appendChild(el('p', 'text-sm font-semibold text-(--texto)', 'Reponer stock'));
        const fila = el('div', 'flex gap-2');
        const etiqueta = el('label', 'sr-only', 'Unidades a reponer de ' + p.nombre);
        etiqueta.setAttribute('for', 'rep-' + p.id);
        const input = el('input', 'w-24 rounded-lg border border-(--borde) bg-(--superficie) px-3 py-2.5 text-sm text-(--texto) focus:outline-none focus:border-(--acento) focus:ring-2 focus:ring-(--acento)/30');
        input.id = 'rep-' + p.id;
        input.type = 'number';
        input.min = '1';
        input.step = '1';
        input.inputMode = 'numeric';
        input.value = sugerido(p);
        const enviar = el('button', 'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--acento-hover) px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition hover:bg-(--texto) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--acento-hover)');
        enviar.type = 'submit';
        enviar.appendChild(el('i', 'fa-solid fa-plus text-[11px]'));
        enviar.appendChild(document.createTextNode(' Reponer'));
        fila.appendChild(etiqueta);
        fila.appendChild(input);
        fila.appendChild(enviar);
        form.appendChild(fila);
        form.appendChild(el('p', 'text-xs text-(--texto-suave)', 'Sugerido: llevar el stock a ' + plural(p.stock + sugerido(p)) + ' (el doble del mínimo).'));
        li.appendChild(form);

        // Acción 2: contactar al proveedor
        const prov = proveedorDe(p);
        const caja = el('div', 'flex flex-col gap-2 border-t border-(--borde) pt-3');
        if (prov.nombre) {
            caja.appendChild(el('p', 'text-sm text-(--texto-suave)', 'Proveedor: ' + prov.nombre));
        } else {
            caja.appendChild(el('p', 'text-sm text-(--texto-suave)', 'Este producto no tiene proveedor asignado en el catálogo.'));
        }
        const botones = el('div', 'flex flex-wrap gap-2');
        const clasesBoton = 'inline-flex items-center gap-1.5 rounded-full border border-(--borde) px-3.5 py-2 text-sm font-medium text-(--texto) transition hover:border-(--acento) hover:text-(--acento-hover)';
        if (prov.datos && prov.datos.telefono) {
            const llamar = boton(clasesBoton, 'fa-solid fa-phone', 'Llamar');
            llamar.href = 'tel:' + prov.datos.telefono.replace(/[^\d+]/g, '');
            llamar.setAttribute('aria-label', 'Llamar a ' + prov.nombre + ' al ' + prov.datos.telefono);
            botones.appendChild(llamar);
        }
        if (prov.datos && prov.datos.email) {
            const escribir = boton(clasesBoton, 'fa-regular fa-envelope', 'Escribir');
            const asunto = encodeURIComponent('Pedido de ' + p.nombre);
            const cuerpo = encodeURIComponent('Hola, necesitamos reponer ' + p.nombre + ' (' + p.codigo + '). Stock actual: ' + p.stock + '. Mínimo requerido: ' + p.minimo + '.');
            escribir.href = 'mailto:' + prov.datos.email + '?subject=' + asunto + '&body=' + cuerpo;
            botones.appendChild(escribir);
        }
        const verProv = boton(clasesBoton, 'fa-solid fa-truck', prov.datos ? 'Ver proveedor' : 'Ir a proveedores');
        verProv.href = '#proveedores';
        botones.appendChild(verProv);
        const verInv = boton(clasesBoton, 'fa-solid fa-boxes-stacked', 'Ver en inventario');
        verInv.href = '#inventario';
        botones.appendChild(verInv);
        caja.appendChild(botones);
        li.appendChild(caja);

        return li;
    }

    function activas() {
        return productos
            .filter(function (p) { return estadoDe(p) !== 'disponible'; })
            .sort(function (a, b) {
                const orden = { agotado: 0, bajo: 1 };
                return orden[estadoDe(a)] - orden[estadoDe(b)] || a.nombre.localeCompare(b.nombre);
            });
    }

    function render() {
        const todas = activas();
        const nAgotado = todas.filter(function (p) { return estadoDe(p) === 'agotado'; }).length;
        const nBajo = todas.length - nAgotado;
        document.getElementById('alertas-n-todas').textContent = todas.length;
        document.getElementById('alertas-n-agotado').textContent = nAgotado;
        document.getElementById('alertas-n-bajo').textContent = nBajo;
        subtitulo.textContent = todas.length === 0
            ? 'No tenés alertas pendientes.'
            : todas.length + (todas.length === 1 ? ' producto necesita' : ' productos necesitan') + ' atención.';

        const visibles = todas.filter(function (p) { return filtro === 'todas' || estadoDe(p) === filtro; });
        lista.replaceChildren(...visibles.map(crearTarjeta));
        lista.classList.toggle('hidden', visibles.length === 0);

        vacio.classList.toggle('hidden', visibles.length > 0);
        vacioTexto.textContent = todas.length === 0
            ? 'No hay productos con stock bajo ni agotados.'
            : 'No hay alertas en esta categoría.';

        filtros.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro)); });
    }

    filtros.forEach(function (b) {
        b.addEventListener('click', function () {
            filtro = b.dataset.filtro;
            render();
        });
    });

    lista.addEventListener('submit', function (e) {
        const form = e.target.closest('form[data-id]');
        if (!form) return;
        e.preventDefault();
        const id = Number(form.dataset.id);
        const p = productos.find(function (x) { return x.id === id; });
        const cantidad = parseInt(form.querySelector('input').value, 10);
        if (!p) return;
        if (!(cantidad >= 1)) {
            avisar('Ingresá una cantidad de 1 o más para reponer.');
            mensaje.className = 'mt-4 rounded-lg border border-(--viz-naranja)/40 bg-(--viz-naranja-fondo) px-4 py-2.5 text-sm text-(--viz-naranja-texto)';
            return;
        }
        const antes = estadoDe(p);
        const nombre = p.nombre;
        cambiarStock(id, p.stock + cantidad);   // guarda y actualiza Inventario, Resumen y campana
        const despues = estadoDe(productos.find(function (x) { return x.id === id; }));
        const nuevo = productos.find(function (x) { return x.id === id; }).stock;
        mensaje.className = 'mt-4 rounded-lg border border-(--viz-verde)/40 bg-(--viz-verde-fondo) px-4 py-2.5 text-sm text-(--viz-verde-texto)';
        avisar('Se agregaron ' + plural(cantidad) + ' a ' + nombre + ' (ahora ' + plural(nuevo) + ')' +
            (despues === 'disponible' ? '. La alerta se resolvió.' : (antes === 'agotado' ? '. Ya no está sin stock, pero sigue bajo el mínimo.' : '. Sigue bajo el mínimo.')));
    });

    // Se actualiza cada vez que cambia el inventario
    document.addEventListener('inventario:cambio', render);
    render();
})();
