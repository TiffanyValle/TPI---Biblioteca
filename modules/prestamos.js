const { ObjectId } = require("mongodb");
const { preguntar, obtenerId } = require("../utils/entrada");


// READ: LISTAR PRÉSTAMOS ACTIVOS

async function listarPrestamos(prestamos, libros, socios) {
    const resultado = await prestamos.find({
        activo: true
    }).toArray();

    console.log("\n--- PRÉSTAMOS ACTIVOS ---");

    if (resultado.length === 0) {
        console.log("No hay préstamos activos.");
        return;
    }

    for (const prestamo of resultado) {
        const libro = await libros.findOne({ _id: prestamo.libroId });
        const socio = await socios.findOne({ _id: prestamo.socioId });

        console.log("------------------------------");
        console.log("ID:", prestamo._id.toString());
        console.log("Libro:", libro ? libro.titulo : "No encontrado");
        console.log("Socio:", socio
            ? `${socio.nombre} ${socio.apellidos}`
            : "No encontrado");
        console.log("Fecha de préstamo:", prestamo.fechaPrestamo);
        console.log("Fecha prevista de devolución:", prestamo.devolucion.fechaPrevista);
        console.log("Fecha real de devolución:", prestamo.devolucion.fechaReal || "Pendiente");
        console.log("Estado:", prestamo.estado);
    }

    console.log("------------------------------");
    console.log("Total de préstamos activos:", resultado.length);
}

// READ: BUSCAR PRÉSTAMO POR ID

async function buscarPrestamo(prestamos, libros, socios) {
    console.log("\n--- BUSCAR PRÉSTAMO ---");

    const id = await obtenerId("ID del préstamo: ");
    if (!id) return;

    const prestamo = await prestamos.findOne({
        _id: id,
        activo: true
    });

    if (!prestamo) {
        console.log("No se encontró el préstamo.");
        return;
    }

    const libro = await libros.findOne({ _id: prestamo.libroId });
    const socio = await socios.findOne({ _id: prestamo.socioId });

    console.log("------------------------------");
    console.log("ID:", prestamo._id.toString());
    console.log("Libro:", libro ? libro.titulo : "No encontrado");
    console.log("Socio:", socio
        ? `${socio.nombre} ${socio.apellidos}`
        : "No encontrado");
    console.log("Fecha de préstamo:", prestamo.fechaPrestamo);
    console.log("Fecha prevista de devolución:", prestamo.devolucion.fechaPrevista);
    console.log("Fecha real de devolución:", prestamo.devolucion.fechaReal || "Pendiente");
    console.log("Estado:", prestamo.estado);
}

// CREATE: REGISTRAR PRÉSTAMO

async function crearPrestamo(prestamos, libros, socios) {
    console.log("\n--- REGISTRAR PRÉSTAMO ---");

    const isbn = await preguntar("ISBN del libro: ");
    if (!isbn) {
        console.log("Error: el ISBN es obligatorio.");
        return;
    }

    const libro = await libros.findOne({
        isbn,
        activo: true
    });

    if (!libro) {
        console.log("El libro no existe o está desactivado.");
        return;
    }

    if (!libro.disponible) {
        console.log("El libro no está disponible.");
        return;
    }

    const dni = (await preguntar("DNI del socio: ")).toUpperCase();
    if (!dni) {
        console.log("Error: el DNI es obligatorio.");
        return;
    }

    const socio = await socios.findOne({
        dni,
        activo: true
    });

    if (!socio) {
        console.log("El socio no existe o está desactivado.");
        return;
    }

    const fechaPrestamo = new Date();
    const fechaPrevista = new Date(fechaPrestamo);
    fechaPrevista.setDate(fechaPrevista.getDate() + 14);

    const nuevoPrestamo = {
        libroId: libro._id,
        socioId: socio._id,
        fechaPrestamo,
        estado: "activo",
        devolucion: {
            fechaPrevista,
            fechaReal: null
        },
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await prestamos.insertOne(nuevoPrestamo);

    await libros.updateOne(
        { _id: libro._id },
        {
            $set: {
                disponible: false,
                updatedAt: new Date()
            }
        }
    );

    console.log("Préstamo registrado correctamente.");
    console.log("Fecha prevista de devolución:", fechaPrevista.toLocaleDateString());
}

// UPDATE: REGISTRAR DEVOLUCIÓN DE UN PRÉSTAMO

async function modificarPrestamo(prestamos, libros) {
    console.log("\n--- MODIFICAR PRÉSTAMO ---");

    const id = await obtenerId("ID del préstamo: ");
    if (!id) return;

    const prestamo = await prestamos.findOne({
        _id: id,
        activo: true
    });

    if (!prestamo) {
        console.log("No se encontró el préstamo.");
        return;
    }

    console.log("Estado actual:", prestamo.estado);

    if (prestamo.estado === "devuelto") {
        console.log("Este préstamo ya ha sido devuelto.");
        return;
    }

    if (prestamo.estado !== "activo") {
        console.log("Solo se puede registrar la devolución de un préstamo con estado activo.");
        return;
    }

    const confirmar = (
        await preguntar("¿Confirmar la devolución del libro? (s/n): ")
    ).toLowerCase();

    if (confirmar !== "s") {
        console.log("Operación cancelada.");
        return;
    }

    const fechaReal = new Date();

    await prestamos.updateOne(
        { _id: id },
        {
            $set: {
                estado: "devuelto",
                "devolucion.fechaReal": fechaReal,
                updatedAt: new Date()
            }
        }
    );

    await libros.updateOne(
        { _id: prestamo.libroId },
        {
            $set: {
                disponible: true,
                updatedAt: new Date()
            }
        }
    );

    console.log("Devolución registrada correctamente.");
}

// DELETE: DESACTIVAR UN PRÉSTAMO

async function eliminarPrestamo(prestamos) {
    console.log("\n--- ELIMINAR PRÉSTAMO ---");

    const id = await obtenerId("ID del préstamo: ");
    if (!id) return;

    const prestamo = await prestamos.findOne({
        _id: id,
        activo: true
    });

    if (!prestamo) {
        console.log("No se encontró el préstamo.");
        return;
    }

    if (prestamo.estado === "activo") {
        console.log(
            "No se puede desactivar un préstamo que todavía está pendiente."
        );
        return;
    }

    const confirmar = (
        await preguntar("¿Deseas desactivar este préstamo? (s/n): ")
    ).toLowerCase();

    if (confirmar !== "s") {
        console.log("Operación cancelada.");
        return;
    }

    await prestamos.updateOne(
        { _id: id },
        {
            $set: {
                activo: false,
                updatedAt: new Date()
            }
        }
    );

    console.log("Préstamo desactivado correctamente.");
}

module.exports = { listarPrestamos, buscarPrestamo, crearPrestamo, modificarPrestamo, eliminarPrestamo };
