# Gestión de Stock

Página web para ayudar a emprendedores a organizar el stock de sus productos.

🔗 **Demo:** https://inventory-management-sigma-henna.vercel.app/

## Estado

En desarrollo. Incluye página de inicio, login y un panel con resumen, alertas, inventario, productos, documentación, proveedores, ventas y balances. Los datos se guardan en el navegador (localStorage).

## Tecnologías

- React 19 + React Router
- Vite
- Tailwind CSS 4
- Font Awesome y Google Fonts (Noto Sans)

## Estructura

```
├── index.html          # Único HTML (monta la app de React)
├── vercel.json         # Redirige todas las rutas a index.html
├── public/images/      # Logo e imágenes
└── src/
    ├── main.jsx        # Punto de entrada
    ├── App.jsx         # Rutas: /, /login, /dashboard/*
    ├── index.css       # Tailwind y paleta de colores
    ├── store/          # Datos compartidos (localStorage)
    ├── components/     # Componentes reutilizables
    └── pages/          # Home, Login y secciones del dashboard
```

## Uso

```
npm install
npm run dev      # desarrollo
npm run build    # genera dist/
```

## Diseño

Responsive (celular, tablet y escritorio) con paleta clara en tonos crema, marrón y blanco.
