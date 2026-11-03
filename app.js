const { conectarBD, cerrarBD } = require("./config/database");
const { preguntar, cerrarEntrada } = require("./utils/entrada");
const { listarLibros, buscarLibro, crearLibro, modificarLibro, eliminarLibro } = require("./modules/libros");
const { listarSocios, buscarSocio, crearSocio, modificarSocio, eliminarSocio } = require("./modules/socios");
const { listarPrestamos, buscarPrestamo, crearPrestamo, modificarPrestamo, eliminarPrestamo } = require("./modules/prestamos");

// --------------------------------------------------
// MENÚS
// --------------------------------------------------

async function menuLibros(libros, prestamos) {
    let opcion;

    do {
        console.log("\n========== MENÚ LIBROS ==========");
        console.log("1. Listar libros");
        console.log("2. Buscar libro por ISBN");
        console.log("3. Registrar libro");
        console.log("4. Modificar libro");
        console.log("5. Desactivar libro");
        console.log("0. Volver al menú principal");

        opcion = await preguntar("Selecciona una opción: ");

        try {
            switch (opcion) {
                case "1":
                    await listarLibros(libros);
                    break;
                case "2":
                    await buscarLibro(libros);
                    break;
                case "3":
                    await crearLibro(libros);
                    break;
                case "4":
                    await modificarLibro(libros);
                    break;
                case "5":
                    await eliminarLibro(libros, prestamos);
                    break;
                case "0":
                    break;
                default:
                    console.log("Opción no válida.");
            }
        } catch (error) {
            console.error("Error al realizar la operación:", error.message);
        }
    } while (opcion !== "0");
}

async function menuSocios(socios, prestamos) {
    let opcion;

    do {
        console.log("\n========== MENÚ SOCIOS ==========");
        console.log("1. Listar socios");
        console.log("2. Buscar socio por DNI");
        console.log("3. Registrar socio");
        console.log("4. Modificar socio");
        console.log("5. Desactivar socio");
        console.log("0. Volver al menú principal");

        opcion = await preguntar("Selecciona una opción: ");

        try {
            switch (opcion) {
                case "1":
                    await listarSocios(socios);
                    break;
                case "2":
                    await buscarSocio(socios);
                    break;
                case "3":
                    await crearSocio(socios);
                    break;
                case "4":
                    await modificarSocio(socios);
                    break;
                case "5":
                    await eliminarSocio(socios, prestamos);
                    break;
                case "0":
                    break;
                default:
                    console.log("Opción no válida.");
            }
        } catch (error) {
            console.error("Error al realizar la operación:", error.message);
        }
    } while (opcion !== "0");
}

async function menuPrestamos(prestamos, libros, socios) {
    let opcion;

    do {
        console.log("\n========== MENÚ PRÉSTAMOS ==========");
        console.log("1. Listar préstamos");
        console.log("2. Buscar préstamo por ID");
        console.log("3. Registrar préstamo");
        console.log("4. Registrar devolución");
        console.log("5. Desactivar préstamo");
        console.log("0. Volver al menú principal");

        opcion = await preguntar("Selecciona una opción: ");

        try {
            switch (opcion) {
                case "1":
                    await listarPrestamos(prestamos, libros, socios);
                    break;
                case "2":
                    await buscarPrestamo(prestamos, libros, socios);
                    break;
                case "3":
                    await crearPrestamo(prestamos, libros, socios);
                    break;
                case "4":
                    await modificarPrestamo(prestamos, libros);
                    break;
                case "5":
                    await eliminarPrestamo(prestamos);
                    break;
                case "0":
                    break;
                default:
                    console.log("Opción no válida.");
            }
        } catch (error) {
            console.error("Error al realizar la operación:", error.message);
        }
    } while (opcion !== "0");
}

// --------------------------------------------------
// MENÚ PRINCIPAL
// --------------------------------------------------

async function menuPrincipal(db) {
    const libros = db.collection("libros");
    const socios = db.collection("socios");
    const prestamos = db.collection("prestamos");

    let opcion;

    do {
        console.log("\n==================================");
        console.log("   SISTEMA DE GESTIÓN DE BIBLIOTECA");
        console.log("==================================");
        console.log("1. Gestión de libros");
        console.log("2. Gestión de socios");
        console.log("3. Gestión de préstamos");
        console.log("0. Salir");

        opcion = await preguntar("Selecciona una opción: ");

        try {
            switch (opcion) {
                case "1":
                    await menuLibros(libros, prestamos);
                    break;
                case "2":
                    await menuSocios(socios, prestamos);
                    break;
                case "3":
                    await menuPrestamos(prestamos, libros, socios);
                    break;
                case "0":
                    console.log("Cerrando el programa...");
                    break;
                default:
                    console.log("Opción no válida.");
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    } while (opcion !== "0");
}


async function main() {
    try {
        const db = await conectarBD();
        console.log("Conexión con MongoDB establecida correctamente.");
        await menuPrincipal(db);
    } catch (error) {
        console.error("Error en la aplicación:", error.message);
    } finally {
        await cerrarBD();
        cerrarEntrada();
        console.log("Conexión con MongoDB cerrada.");
    }
}

main();
