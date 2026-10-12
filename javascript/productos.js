(function () {
    const CLAVE = 'gestion-stock-catalogo';
    const CAMPOS_BUSQUEDA = ['nombre', 'sku', 'categoria', 'marca', 'modelo', 'color', 'serial', 'proveedor'];
    const DETALLES = [
        { clave: 'categoria', etiqueta: 'Categoría' },
        { clave: 'marca', etiqueta: 'Marca' },
        { clave: 'modelo', etiqueta: 'Modelo' },
        { clave: 'color', etiqueta: 'Color' },
        { clave: 'serial', etiqueta: 'Serial' },
        { clave: 'proveedor', etiqueta: 'Proveedor' },
        { clave: 'precio', etiqueta: 'Precio' }
    ];
    const MONEDA = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    const EJEMPLOS = [
        { id: 1, nombre: 'Memoria RAM 16 GB', sku: 'RAM-001', categoria: 'Memorias', marca: 'Kingston', modelo: 'Fury Beast DDR4', color: 'Negro', serial: 'KF-2024-0001', proveedor: 'Distribuidora Tech', precio: 45000 },
        { id: 2, nombre: 'SSD 500 GB', sku: 'SSD-002', categoria: 'Almacenamiento', marca: 'Samsung', modelo: '870 EVO', color: 'Negro', serial: 'SM-2024-0002', proveedor: 'Distribuidora Tech', precio: 68000 },
        { id: 3, nombre: 'Teclado mecánico', sku: 'TEC-003', categoria: 'Periféricos', marca: 'Redragon', modelo: 'Kumara K552', color: 'Negro y rojo', serial: 'RD-2024-0003', proveedor: 'Mayorista Norte', precio: 32000 }
    ];

    const body = document.getElementById('prod-body');
    const vacia = document.getElementById('prod-vacia');
    const total = document.getElementById('prod-total');
    const buscador = document.getElementById('prod-buscar');
    const dialogo = document.getElementById('prod-dialogo');
    const form = document.getElementById('prod-form');
    const titulo = document.getElementById('prod-dialogo-titulo');
    const error = document.getElementById('prod-error');
    const campoId = document.getElementById('prod-id');
    if (!body || !dialogo) return;

    function cargar() {
        try {
            const guardado = localStorage.getItem(CLAVE);
            if (guardado) return JSON.parse(guardado);
        } catch (e) { /* sin almacenamiento disponible */ }
        return EJEMPLOS.map(function (p) { return Object.assign({}, p); });
    }

    let productos = cargar();

    function guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(productos));
        } catch (e) { /* sin almacenamiento disponible */ }
    }

    function el(etiqueta, clases, texto) {
        const nodo = document.createElement(etiqueta);
        if (clases) nodo.className = clases;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function boton(id, accion, icono, etiqueta, clasesExtra) {
        const b = el('button', 'flex size-10 items-center justify-center rounded-full text-(--texto-suave) cursor-pointer transition xl:size-8 ' + clasesExtra);
        b.type = 'button';
        b.dataset.id = id;
        b.dataset.accion = accion;
        b.setAttribute('aria-label', etiqueta);
        b.appendChild(el('i', icono + ' text-sm'));
        return b;
    }

    function crearFila(p) {
        const tr = el('tr', 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-(--borde) py-4 last:border-0 hover:bg-(--fondo)/60 xl:table-row xl:py-0');

        tr.appendChild(el('td', 'col-start-1 row-start-1 font-semibold text-(--texto) xl:py-3.5 xl:pr-4 xl:font-medium', p.nombre));
        tr.appendChild(el('td', 'col-span-2 row-start-2 font-mono text-sm text-(--texto-suave) xl:py-3.5 xl:pr-4 xl:whitespace-nowrap', p.sku));

        DETALLES.forEach(function (d, i) {
            const td = el('td', 'col-span-2 row-start-' + (i + 3) + ' flex items-baseline justify-between gap-3 text-sm text-(--texto) xl:table-cell xl:py-3.5 xl:pr-4' + (d.clave === 'serial' || d.clave === 'precio' ? ' xl:whitespace-nowrap' : ''));
            td.appendChild(el('span', 'text-xs font-semibold uppercase tracking-wider text-(--texto-suave) xl:hidden', d.etiqueta));
            let valor = p[d.clave];
            if (d.clave === 'precio') valor = typeof valor === 'number' ? MONEDA.format(valor) : '';
            td.appendChild(el('span', d.clave === 'serial' ? 'font-mono' : (d.clave === 'precio' ? 'font-semibold' : ''), valor || '—'));
            tr.appendChild(td);
        });

        const acciones = el('td', 'col-start-2 row-start-1 flex justify-self-end gap-1 xl:table-cell xl:py-3.5 xl:text-right xl:whitespace-nowrap');
        acciones.appendChild(boton(p.id, 'editar', 'fa-regular fa-pen-to-square', 'Editar ' + p.nombre, 'hover:bg-(--fondo) hover:text-(--acento-hover) xl:inline-flex'));
        acciones.appendChild(boton(p.id, 'borrar', 'fa-regular fa-trash-can', 'Eliminar ' + p.nombre, 'hover:bg-(--stock-agotado)/10 hover:text-(--stock-agotado) xl:inline-flex'));
        tr.appendChild(acciones);

        return tr;
    }

    function filtrados() {
        const q = buscador.value.trim().toLowerCase();
        if (!q) return productos;
        return productos.filter(function (p) {
            return CAMPOS_BUSQUEDA.some(function (c) {
                return String(p[c] || '').toLowerCase().indexOf(q) !== -1;
            });
        });
    }

    function actualizarSugerencias() {
        [['categoria', 'prod-lista-categorias'], ['proveedor', 'prod-lista-proveedores']].forEach(function (par) {
            const lista = document.getElementById(par[1]);
            const valores = [];
            productos.forEach(function (p) {
                if (p[par[0]] && valores.indexOf(p[par[0]]) === -1) valores.push(p[par[0]]);
            });
            lista.replaceChildren(...valores.sort().map(function (v) {
                const o = document.createElement('option');
                o.value = v;
                return o;
            }));
        });
    }

    function render() {
        actualizarSugerencias();
        const lista = filtrados();
        body.replaceChildren(...lista.map(crearFila));
        total.textContent = productos.length + (productos.length === 1 ? ' producto' : ' productos');
        if (productos.length === 0) {
            vacia.textContent = 'Todavía no cargaste productos. Tocá "Nuevo producto" para empezar.';
        } else {
            vacia.textContent = 'No hay productos que coincidan con la búsqueda.';
        }
        vacia.classList.toggle('hidden', lista.length > 0);
    }

    function abrir(producto) {
        form.reset();
        error.classList.add('hidden');
        campoId.value = producto ? producto.id : '';
        titulo.textContent = producto ? 'Editar producto' : 'Nuevo producto';
        if (producto) {
            document.getElementById('prod-nombre').value = producto.nombre;
            document.getElementById('prod-sku').value = producto.sku;
            document.getElementById('prod-categoria').value = producto.categoria || '';
            document.getElementById('prod-marca').value = producto.marca || '';
            document.getElementById('prod-modelo').value = producto.modelo || '';
            document.getElementById('prod-color').value = producto.color || '';
            document.getElementById('prod-serial').value = producto.serial || '';
            document.getElementById('prod-proveedor').value = producto.proveedor || '';
            document.getElementById('prod-precio').value = typeof producto.precio === 'number' ? producto.precio : '';
        }
        dialogo.showModal();
        document.getElementById('prod-nombre').focus();
    }

    document.getElementById('prod-nuevo').addEventListener('click', function () { abrir(null); });
    document.getElementById('prod-cancelar').addEventListener('click', function () { dialogo.close(); });
    buscador.addEventListener('input', render);

    body.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-accion]');
        if (!b) return;
        const id = Number(b.dataset.id);
        const p = productos.find(function (x) { return x.id === id; });
        if (!p) return;
        if (b.dataset.accion === 'editar') {
            abrir(p);
        } else if (b.dataset.accion === 'borrar') {
            if (window.confirm('¿Eliminar "' + p.nombre + '" del catálogo?')) {
                productos = productos.filter(function (x) { return x.id !== id; });
                guardar();
                render();
            }
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const datos = {
            nombre: document.getElementById('prod-nombre').value.trim(),
            sku: document.getElementById('prod-sku').value.trim().toUpperCase(),
            categoria: document.getElementById('prod-categoria').value.trim(),
            marca: document.getElementById('prod-marca').value.trim(),
            modelo: document.getElementById('prod-modelo').value.trim(),
            color: document.getElementById('prod-color').value.trim(),
            serial: document.getElementById('prod-serial').value.trim(),
            proveedor: document.getElementById('prod-proveedor').value.trim(),
            precio: parseFloat(document.getElementById('prod-precio').value)
        };
        if (!(datos.precio >= 0)) datos.precio = null;
        const idEditado = campoId.value ? Number(campoId.value) : null;

        let mensaje = '';
        if (!datos.nombre || !datos.sku) {
            mensaje = 'Completá el nombre y el SKU del producto.';
        } else if (productos.some(function (p) { return p.sku === datos.sku && p.id !== idEditado; })) {
            mensaje = 'Ya existe un producto con el SKU ' + datos.sku + '.';
        }
        if (mensaje) {
            error.textContent = mensaje;
            error.classList.remove('hidden');
            return;
        }

        if (idEditado) {
            const p = productos.find(function (x) { return x.id === idEditado; });
            if (p) Object.assign(p, datos);
        } else {
            const id = productos.reduce(function (max, p) { return Math.max(max, p.id); }, 0) + 1;
            productos.push(Object.assign({ id: id }, datos));
        }
        guardar();
        render();
        dialogo.close();
    });

    render();

    /* Lista actual del catálogo, para que otras secciones (Ventas) tomen nombre y precio */
    window.obtenerCatalogo = function () {
        return productos.map(function (p) { return Object.assign({}, p); });
    };
})();
