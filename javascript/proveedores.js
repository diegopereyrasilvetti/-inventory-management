(function () {
    const CLAVE = 'gestion-stock-proveedores';
    const EJEMPLOS = [
        { id: 1, nombre: 'Distribuidora Central', rubro: 'Mercadería general', contacto: 'Carlos Gómez', telefono: '+54 11 5555-0101', email: 'ventas@distribuidoracentral.example', activo: true },
        { id: 2, nombre: 'Insumos del Sur', rubro: 'Insumos', contacto: 'María López', telefono: '+54 11 5555-0102', email: '', activo: true },
        { id: 3, nombre: 'Importadora Norte', rubro: 'Importación', contacto: 'Juan Pérez', telefono: '+54 11 5555-0103', email: '', activo: false }
    ];

    const lista = document.getElementById('prv-lista');
    const vacia = document.getElementById('prv-vacia');
    const buscador = document.getElementById('prv-buscar');
    const dialogo = document.getElementById('prv-dialogo');
    const form = document.getElementById('prv-form');
    const error = document.getElementById('prv-error');
    const campoId = document.getElementById('prv-id');
    const btnEliminar = document.getElementById('prv-eliminar');
    const dialogoVer = document.getElementById('prv-ver');
    if (!lista || !dialogo || !dialogoVer) return;

    let verId = null;

    function cargar() {
        try {
            const guardado = localStorage.getItem(CLAVE);
            if (guardado) return JSON.parse(guardado);
        } catch (e) { /* sin almacenamiento disponible */ }
        return EJEMPLOS.map(function (p) { return Object.assign({}, p); });
    }

    let proveedores = cargar();

    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(proveedores));
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    function el(etiqueta, clases, texto) {
        const nodo = document.createElement(etiqueta);
        if (clases) nodo.className = clases;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function hrefTelefono(telefono) {
        return 'tel:' + telefono.replace(/[^\d+]/g, '');
    }

    function badgeEstado(activo) {
        return el('span', 'inline-block rounded-full px-3 py-1 text-xs font-semibold ' +
            (activo ? 'bg-(--stock-ok)/15 text-[#3f6b34]' : 'bg-(--fondo) text-(--texto-suave) ring-1 ring-(--borde)'),
            activo ? 'Activo' : 'Inactivo');
    }

    function botonIcono(id, accion, icono, etiqueta) {
        const b = el('button', 'flex size-10 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition hover:bg-(--fondo) hover:text-(--acento-hover) sm:size-8');
        b.type = 'button';
        b.dataset.id = id;
        b.dataset.accion = accion;
        b.setAttribute('aria-label', etiqueta);
        b.appendChild(el('i', icono + ' text-sm'));
        return b;
    }

    function crearFila(p) {
        const fila = el('div', 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-(--borde) py-3.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_13rem_7rem_5.5rem] sm:gap-4');
        fila.setAttribute('role', 'row');

        const celdaNombre = el('div', 'min-w-0');
        celdaNombre.appendChild(el('p', 'truncate text-sm font-semibold text-(--texto)', p.nombre));
        celdaNombre.appendChild(el('p', 'truncate text-xs text-(--texto-suave)', p.rubro || 'Sin rubro'));
        fila.appendChild(celdaNombre);

        const acciones = el('span', 'col-start-2 row-start-1 flex justify-self-end gap-1 sm:col-start-4');
        acciones.appendChild(botonIcono(p.id, 'ver', 'fa-regular fa-eye', 'Ver contacto de ' + p.nombre));
        acciones.appendChild(botonIcono(p.id, 'editar', 'fa-regular fa-pen-to-square', 'Editar ' + p.nombre));
        fila.appendChild(acciones);

        const contacto = el('div', 'col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1');
        contacto.appendChild(el('p', 'truncate text-sm text-(--texto)', p.contacto || '—'));
        if (p.telefono) {
            const enlace = el('a', 'inline-flex items-center gap-1.5 text-xs font-medium text-(--acento-hover) hover:underline', p.telefono);
            enlace.href = hrefTelefono(p.telefono);
            enlace.setAttribute('aria-label', 'Llamar a ' + p.nombre + ' al ' + p.telefono);
            const icono = el('i', 'fa-solid fa-phone text-[10px]');
            enlace.prepend(icono);
            contacto.appendChild(enlace);
        } else {
            contacto.appendChild(el('p', 'text-xs text-(--texto-suave)', 'Sin teléfono'));
        }
        fila.appendChild(contacto);

        const estado = el('span', 'col-start-2 row-start-2 justify-self-end sm:col-start-3 sm:row-start-1 sm:justify-self-start');
        estado.appendChild(badgeEstado(p.activo));
        fila.appendChild(estado);

        return fila;
    }

    function filtrados() {
        const q = buscador.value.trim().toLowerCase();
        if (!q) return proveedores;
        return proveedores.filter(function (p) {
            return [p.nombre, p.rubro, p.contacto, p.telefono, p.email].some(function (c) {
                return String(c || '').toLowerCase().indexOf(q) !== -1;
            });
        });
    }

    function render() {
        const activos = proveedores.filter(function (p) { return p.activo; }).length;
        document.getElementById('prv-total').textContent = proveedores.length;
        document.getElementById('prv-activos').textContent = activos;
        document.getElementById('prv-inactivos').textContent = proveedores.length - activos;
        document.getElementById('prv-subtitulo').textContent = proveedores.length + (proveedores.length === 1 ? ' proveedor registrado' : ' proveedores registrados');

        const visibles = filtrados();
        lista.replaceChildren(...visibles.map(crearFila));
        vacia.textContent = proveedores.length === 0
            ? 'Todavía no cargaste proveedores. Tocá "Nuevo proveedor" para empezar.'
            : 'No hay proveedores que coincidan con la búsqueda.';
        vacia.classList.toggle('hidden', visibles.length > 0);
    }

    /* ---------- Crear / editar ---------- */
    function abrirFormulario(p) {
        form.reset();
        error.classList.add('hidden');
        campoId.value = p ? p.id : '';
        document.getElementById('prv-dialogo-titulo').textContent = p ? 'Editar proveedor' : 'Nuevo proveedor';
        btnEliminar.classList.toggle('hidden', !p);
        if (p) {
            document.getElementById('prv-nombre').value = p.nombre;
            document.getElementById('prv-rubro').value = p.rubro || '';
            document.getElementById('prv-contacto').value = p.contacto || '';
            document.getElementById('prv-telefono').value = p.telefono || '';
            document.getElementById('prv-email').value = p.email || '';
            document.getElementById('prv-estado').value = p.activo ? 'activo' : 'inactivo';
        }
        dialogo.showModal();
        document.getElementById('prv-nombre').focus();
    }

    document.getElementById('prv-nuevo').addEventListener('click', function () { abrirFormulario(null); });
    document.getElementById('prv-cancelar').addEventListener('click', function () { dialogo.close(); });
    buscador.addEventListener('input', render);

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const datos = {
            nombre: document.getElementById('prv-nombre').value.trim(),
            rubro: document.getElementById('prv-rubro').value.trim(),
            contacto: document.getElementById('prv-contacto').value.trim(),
            telefono: document.getElementById('prv-telefono').value.trim(),
            email: document.getElementById('prv-email').value.trim(),
            activo: document.getElementById('prv-estado').value === 'activo'
        };
        const idEditado = campoId.value ? Number(campoId.value) : null;

        let mensaje = '';
        if (!datos.nombre) {
            mensaje = 'Completá el nombre del proveedor.';
        } else if (datos.telefono && !/^[\d\s+()\-.]{6,25}$/.test(datos.telefono)) {
            mensaje = 'El teléfono solo puede tener números, espacios, + ( ) y guiones.';
        } else if (datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
            mensaje = 'Revisá el formato del email.';
        } else if (proveedores.some(function (p) { return p.nombre.toLowerCase() === datos.nombre.toLowerCase() && p.id !== idEditado; })) {
            mensaje = 'Ya existe un proveedor con ese nombre.';
        }
        if (mensaje) {
            error.textContent = mensaje;
            error.classList.remove('hidden');
            return;
        }

        if (idEditado) {
            const p = proveedores.find(function (x) { return x.id === idEditado; });
            if (p) Object.assign(p, datos);
        } else {
            const id = proveedores.reduce(function (max, p) { return Math.max(max, p.id); }, 0) + 1;
            proveedores.push(Object.assign({ id: id }, datos));
        }
        guardar();
        render();
        dialogo.close();
    });

    btnEliminar.addEventListener('click', function () {
        const id = Number(campoId.value);
        const p = proveedores.find(function (x) { return x.id === id; });
        if (p && window.confirm('¿Eliminar a "' + p.nombre + '" de tus proveedores?')) {
            proveedores = proveedores.filter(function (x) { return x.id !== id; });
            guardar();
            render();
            dialogo.close();
        }
    });

    /* ---------- Ver contacto ---------- */
    function filaDato(etiqueta, valor, enlace, textoEnlace, icono) {
        const caja = el('div', 'rounded-lg border border-(--borde) bg-(--fondo) px-3.5 py-2.5');
        caja.appendChild(el('dt', 'text-xs font-semibold uppercase tracking-wider text-(--texto-suave)', etiqueta));
        const dd = el('dd', 'mt-1 flex flex-wrap items-center justify-between gap-2');
        dd.appendChild(el('span', 'min-w-0 break-words text-sm font-medium text-(--texto)', valor || 'No cargado'));
        if (valor && enlace) {
            const a = el('a', 'inline-flex items-center gap-1.5 rounded-full bg-(--acento-hover) px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-(--texto)', textoEnlace);
            a.href = enlace;
            a.prepend(el('i', icono + ' text-[10px]'));
            dd.appendChild(a);
        }
        caja.appendChild(dd);
        return caja;
    }

    function abrirDetalle(p) {
        verId = p.id;
        document.getElementById('prv-ver-nombre').textContent = p.nombre;
        document.getElementById('prv-ver-rubro').textContent = p.rubro || 'Sin rubro';
        document.getElementById('prv-ver-estado').replaceChildren(badgeEstado(p.activo));
        document.getElementById('prv-ver-datos').replaceChildren(
            filaDato('Persona de contacto', p.contacto),
            filaDato('Teléfono', p.telefono, p.telefono ? hrefTelefono(p.telefono) : '', 'Llamar', 'fa-solid fa-phone'),
            filaDato('Email', p.email, p.email ? 'mailto:' + p.email : '', 'Escribir', 'fa-regular fa-envelope')
        );
        dialogoVer.showModal();
    }

    lista.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-accion]');
        if (!b) return;
        const p = proveedores.find(function (x) { return x.id === Number(b.dataset.id); });
        if (!p) return;
        if (b.dataset.accion === 'ver') abrirDetalle(p);
        else if (b.dataset.accion === 'editar') abrirFormulario(p);
    });

    document.getElementById('prv-ver-cerrar').addEventListener('click', function () { dialogoVer.close(); });
    document.getElementById('prv-ver-editar').addEventListener('click', function () {
        const p = proveedores.find(function (x) { return x.id === verId; });
        dialogoVer.close();
        if (p) abrirFormulario(p);
    });

    render();
})();
