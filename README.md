# Biblioteca

Aplicación de consola con Node.js y MongoDB para gestionar libros, socios y préstamos.

## Requisitos

- Node.js 20.19 o posterior y npm.
- VS Code. Las instrucciones de resguardo utilizan PowerShell en Windows.
- Una conexión a MongoDB Atlas, con un usuario de base de datos y acceso de red habilitado para tu equipo. Consultá la [guía de conexión de Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).

## Preparar el proyecto desde VS Code

1. Abrí la carpeta raíz del proyecto en VS Code.
2. Seleccioná **Terminal > Nueva terminal** y elegí **PowerShell**.
3. Instalá las dependencias desde esa carpeta:

```powershell
npm install
```

4. Si todavía no tenés un archivo `.env`, crealo a partir del ejemplo:

```powershell
if (-not (Test-Path -LiteralPath ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
}
```

5. Editá `.env` y completá `MONGODB_URI` con la cadena de conexión completa de Atlas. Definí también la base de datos:

```dotenv
MONGODB_URI="mongodb+srv://USUARIO:CLAVE@CLUSTER/"
MONGODB_DB=biblioteca
```

Los valores de la URI son ficticios: reemplazalos por los datos de tu conexión. Las variables de entorno existentes tienen prioridad sobre `.env`. Si `MONGODB_DB` está vacía o ausente, se utiliza `biblioteca`.

## Ejecutar la aplicación

Desde la terminal ubicada en la raíz del proyecto:

```powershell
npm start
```

Se abrirá el menú de gestión de libros, socios y préstamos. Elegí `0` en el menú principal para salir.

## Ejecutar el resguardo desde VS Code

Para respaldar la base necesitás [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/installation/), que incluye `mongodump`. Instalá las herramientas y agregá la carpeta que contiene `mongodump.exe` al `PATH` de Windows. Luego abrí una terminal nueva y comprobá su disponibilidad:

```powershell
mongodump --version
```

`npm install` instala las dependencias de Node; MongoDB Database Tools se instala por separado.

Con `.env` configurado, ejecutá desde la terminal PowerShell en la raíz del proyecto una de estas dos opciones:

```powershell
npm run backup
```

O directamente:

```powershell
.\backup.ps1
```

El script usa `mongodump` para conectarse a Atlas y descargar la base indicada en `MONGODB_DB`. Las rutas se construyen a partir de la ubicación del script.

Cada ejecución crea una carpeta de fecha y una subcarpeta de hora dentro de `resguardos_tpi`. Por ejemplo:

```text
resguardos_tpi/
└── 2026-10-31/
    ├── 17-30-05/
    │   └── biblioteca/
    └── 18-10-22/
        └── biblioteca/
```

Si dos respaldos coinciden en el mismo segundo, se agrega un sufijo como `17-30-05-1`. Al finalizar correctamente aparece `Respaldo realizado correctamente.`.

## Archivos locales

`.env`, `node_modules/` y `resguardos_tpi/` están excluidos de Git. Se versionan `.env.example`, `package.json` y `package-lock.json`.

## Estructura del proyecto

La aplicación está desarrollada con Node.js y MongoDB Atlas. Utiliza una estructura modular para separar las operaciones de gestión de libros, socios y préstamos.

- app.js: menú principal de la aplicación.

- config/database.js: conexión con MongoDB Atlas.

- modules/libros.js: operaciones de gestión de libros.

- modules/socios.js: operaciones de gestión de socios.

- modules/prestamos.js: operaciones de gestión de préstamos.

- utils/entrada.js: funciones auxiliares para ingresar datos.

- backup.ps1: script de respaldo de la base de datos.

- cargar-config-backup.js: configuración utilizada para el respaldo.

## Alumnos responsables del desarrollo:
- Damian Geisser
- Tiffany Zoe Valle
- Stefania Peralta