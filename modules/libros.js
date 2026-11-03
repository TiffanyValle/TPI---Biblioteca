const { ObjectId } = require("mongodb");
const { preguntar, obtenerId } = require("../utils/entrada");


// READ: LISTAR LIBROS ACTIVOS

async function listarLibros(libros) {
    const resultado = await libros.find({
        activo: true
    }).toArray();

    console.log("\n--- LIBROS ACTIVOS ---");

    if (resultado.length === 0) {
        console.log("No hay libros activos.");
        return;
    }

    for (const libro of resultado) {
        console.log("------------------------------");
        console.log("ID:", libro._id.toString());
        console.log("Título:", libro.titulo);
        console.log("Autor:", libro.autor);
        console.log("ISBN:", libro.isbn);
        console.log("Año:", libro.anio);
        console.log("Disponible:", libro.disponible);
    }

    console.log("------------------------------");
    console.log("Total de libros activos:", resultado.length);
}

// READ: BUSCAR LIBRO POR ISBN

async function buscarLibro(libros) {
    console.log("\n--- BUSCAR LIBRO ---");

    const isbnBusqueda = await preguntar("ISBN del libro: ");
    if (!isbnBusqueda) {
        console.log("Error: el ISBN es obligatorio.");
        return;
    }

    const libro = await libros.findOne({
        isbn: isbnBusqueda,
        activo: true
    });

    if (!libro) {
        console.log("No se encontró el libro.");
        return;
    }

    console.log("------------------------------");
    console.log("ID:", libro._id.toString());
    console.log("Título:", libro.titulo);
    console.log("Autor:", libro.autor);
    console.log("ISBN:", libro.isbn);
    console.log("Año:", libro.anio);
    console.log("Disponible:", libro.disponible);
}

// CREATE: REGISTRAR UN LIBRO

async function crearLibro(libros) {
    console.log("\n--- REGISTRAR LIBRO ---");

    const titulo = await preguntar("Título: ");
    const autor = await preguntar("Autor: ");
    const isbn = await preguntar("ISBN: ");
    const anioTexto = await preguntar("Año de publicación: ");

    if (!titulo || !autor || !isbn || !anioTexto) {
        console.log("Error: todos los campos son obligatorios.");
        return;
    }

    const anio = Number(anioTexto);

    if (
        !Number.isInteger(anio) ||
        anio < 1 ||
        anio > new Date().getFullYear()
    ) {
        console.log("Error: introduce un año válido.");
        return;
    }

    const existente = await libros.findOne({ isbn });

    if (existente) {
        console.log("Ya existe un libro con ese ISBN.");
        return;
    }

    const nuevoLibro = {
        titulo,
        autor,
        isbn,
        anio,
        disponible: true,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const resultado = await libros.insertOne(nuevoLibro);

    console.log("Libro registrado correctamente.");
    console.log("Identificador:", resultado.insertedId.toString());
}

// UPDATE: MODIFICAR UN LIBRO

async function modificarLibro(libros) {
    console.log("\n--- MODIFICAR LIBRO ---");

    const isbnBusqueda = await preguntar("ISBN del libro: ");
    if (!isbnBusqueda) {
        console.log("Error: el ISBN es obligatorio.");
        return;
    }

    const libro = await libros.findOne({
        isbn: isbnBusqueda,
        activo: true
    });

    if (!libro) {
        console.log("No se encontró el libro.");
        return;
    }

    console.log("Deja vacío un campo para mantener su valor actual.");

    const titulo = await preguntar(`Título (${libro.titulo}): `);
    const autor = await preguntar(`Autor (${libro.autor}): `);
    const isbn = await preguntar(`ISBN (${libro.isbn}): `);
    const anioTexto = await preguntar(`Año (${libro.anio}): `);

    const cambios = {};

    if (titulo) cambios.titulo = titulo;
    if (autor) cambios.autor = autor;

    if (isbn) {
        const existente = await libros.findOne({
            isbn,
            _id: { $ne: libro._id }
        });

        if (existente) {
            console.log("Ya existe otro libro con ese ISBN.");
            return;
        }

        cambios.isbn = isbn;
    }

    if (anioTexto) {
        const anio = Number(anioTexto);

        if (
            !Number.isInteger(anio) ||
            anio < 1 ||
            anio > new Date().getFullYear()
        ) {
            console.log("Error: introduce un año válido.");
            return;
        }

        cambios.anio = anio;
    }

    if (Object.keys(cambios).length === 0) {
        console.log("No se han realizado cambios.");
        return;
    }

    cambios.updatedAt = new Date();

    await libros.updateOne(
        { _id: libro._id },
        { $set: cambios }
    );

    console.log("Libro actualizado correctamente.");
}

// DELETE: DESACTIVAR UN LIBRO

async function eliminarLibro(libros, prestamos) {
    console.log("\n--- ELIMINAR LIBRO ---");

    const isbnBusqueda = await preguntar("ISBN del libro: ");
    if (!isbnBusqueda) {
        console.log("Error: el ISBN es obligatorio.");
        return;
    }

    const libro = await libros.findOne({
        isbn: isbnBusqueda,
        activo: true
    });

    if (!libro) {
        console.log("No se encontró el libro.");
        return;
    }

    const prestamosPendientes = await prestamos.countDocuments({
        libroId: libro._id,
        activo: true,
        estado: "activo"
    });

    if (prestamosPendientes > 0) {
        console.log(
            "No se puede desactivar el libro porque tiene préstamos pendientes."
        );
        return;
    }

    const confirmar = (
        await preguntar("¿Deseas desactivar este libro? (s/n): ")
    ).toLowerCase();

    if (confirmar !== "s") {
        console.log("Operación cancelada.");
        return;
    }

    await libros.updateOne(
        { _id: libro._id },
        {
            $set: {
                activo: false,
                updatedAt: new Date()
            }
        }
    );

    console.log("Libro desactivado correctamente.");
}

module.exports = { listarLibros, buscarLibro, crearLibro, modificarLibro, eliminarLibro };
