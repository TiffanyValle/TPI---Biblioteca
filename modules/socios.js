const { ObjectId } = require("mongodb");
const { preguntar, obtenerId } = require("../utils/entrada");


// READ: LISTAR SOCIOS ACTIVOS

async function listarSocios(socios) {
    const resultado = await socios.find({
        activo: true
    }).toArray();

    console.log("\n--- SOCIOS ACTIVOS ---");

    if (resultado.length === 0) {
        console.log("No hay socios activos.");
        return;
    }

    for (const socio of resultado) {
        console.log("------------------------------");
        console.log("ID:", socio._id.toString());
        console.log("Nombre:", socio.nombre);
        console.log("Apellidos:", socio.apellidos);
        console.log("DNI:", socio.dni);
        console.log("Correo:", socio.correo);
        console.log("Teléfono:", socio.telefono);
    }

    console.log("------------------------------");
    console.log("Total de socios activos:", resultado.length);
}

// READ: BUSCAR SOCIO POR DNI

async function buscarSocio(socios) {
    console.log("\n--- BUSCAR SOCIO ---");

    const dniBusqueda = (await preguntar("DNI del socio: ")).toUpperCase();
    if (!dniBusqueda) {
        console.log("Error: el DNI es obligatorio.");
        return;
    }

    const socio = await socios.findOne({
        dni: dniBusqueda,
        activo: true
    });

    if (!socio) {
        console.log("No se encontró el socio.");
        return;
    }

    console.log("------------------------------");
    console.log("ID:", socio._id.toString());
    console.log("Nombre:", socio.nombre);
    console.log("Apellidos:", socio.apellidos);
    console.log("DNI:", socio.dni);
    console.log("Correo:", socio.correo);
    console.log("Teléfono:", socio.telefono);
}

// CREATE: REGISTRAR UN SOCIO

async function crearSocio(socios) {
    console.log("\n--- REGISTRAR SOCIO ---");

    const nombre = await preguntar("Nombre: ");
    const apellidos = await preguntar("Apellidos: ");
    const dni = (await preguntar("DNI: ")).toUpperCase();
    const correo = await preguntar("Correo electrónico: ");
    const telefono = await preguntar("Teléfono: ");

    if (!nombre || !apellidos || !dni || !correo || !telefono) {
        console.log("Error: todos los campos son obligatorios.");
        return;
    }

    const existente = await socios.findOne({ dni });

    if (existente) {
        console.log("Ya existe un socio con ese DNI.");
        return;
    }

    const nuevoSocio = {
        nombre,
        apellidos,
        dni,
        correo,
        telefono,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const resultado = await socios.insertOne(nuevoSocio);

    console.log("Socio registrado correctamente.");
    console.log("Identificador:", resultado.insertedId.toString());
}

// UPDATE: MODIFICAR UN SOCIO

async function modificarSocio(socios) {
    console.log("\n--- MODIFICAR SOCIO ---");

    const dniBusqueda = (await preguntar("DNI del socio: ")).toUpperCase();
    if (!dniBusqueda) {
        console.log("Error: el DNI es obligatorio.");
        return;
    }

    const socio = await socios.findOne({
        dni: dniBusqueda,
        activo: true
    });

    if (!socio) {
        console.log("No se encontró el socio.");
        return;
    }

    console.log("Deja vacío un campo para mantener su valor actual.");

    const nombre = await preguntar(`Nombre (${socio.nombre}): `);
    const apellidos = await preguntar(`Apellidos (${socio.apellidos}): `);
    const dni = (await preguntar(`DNI (${socio.dni}): `)).toUpperCase();
    const correo = await preguntar(`Correo (${socio.correo}): `);
    const telefono = await preguntar(`Teléfono (${socio.telefono}): `);

    const cambios = {};

    if (nombre) cambios.nombre = nombre;
    if (apellidos) cambios.apellidos = apellidos;
    if (correo) cambios.correo = correo;
    if (telefono) cambios.telefono = telefono;

    if (dni) {
        const existente = await socios.findOne({
            dni,
            _id: { $ne: socio._id }
        });

        if (existente) {
            console.log("Ya existe otro socio con ese DNI.");
            return;
        }

        cambios.dni = dni;
    }

    if (Object.keys(cambios).length === 0) {
        console.log("No se han realizado cambios.");
        return;
    }

    cambios.updatedAt = new Date();

    await socios.updateOne(
        { _id: socio._id },
        { $set: cambios }
    );

    console.log("Socio actualizado correctamente.");
}

// DELETE: DESACTIVAR UN SOCIO

async function eliminarSocio(socios, prestamos) {
    console.log("\n--- ELIMINAR SOCIO ---");

    const dniBusqueda = (await preguntar("DNI del socio: ")).toUpperCase();
    if (!dniBusqueda) {
        console.log("Error: el DNI es obligatorio.");
        return;
    }

    const socio = await socios.findOne({
        dni: dniBusqueda,
        activo: true
    });

    if (!socio) {
        console.log("No se encontró el socio.");
        return;
    }

    const prestamosPendientes = await prestamos.countDocuments({
        socioId: socio._id,
        activo: true,
        estado: "activo"
    });

    if (prestamosPendientes > 0) {
        console.log(
            "No se puede desactivar el socio porque tiene préstamos pendientes."
        );
        return;
    }

    const confirmar = (
        await preguntar("¿Deseas desactivar este socio? (s/n): ")
    ).toLowerCase();

    if (confirmar !== "s") {
        console.log("Operación cancelada.");
        return;
    }

    await socios.updateOne(
        { _id: socio._id },
        {
            $set: {
                activo: false,
                updatedAt: new Date()
            }
        }
    );

    console.log("Socio desactivado correctamente.");
}

module.exports = { listarSocios, buscarSocio, crearSocio, modificarSocio, eliminarSocio };
