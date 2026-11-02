
 // --------------------------------------------------
 // CONFIGURACIÓN
 // --------------------------------------------------

require("dotenv").config();

const { MongoClient, ObjectId } = require("mongodb");
const { createInterface } = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const client = new MongoClient(process.env.MONGODB_URI);

const rl = createInterface({
  input: stdin,
  output: stdout
});

// --------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------

async function preguntar(mensaje) {
  return (await rl.question(mensaje)).trim();
}

function validarObjectId(id) {
  return ObjectId.isValid(id) &&
    new ObjectId(id).toString() === id.toLowerCase();
}

async function obtenerId(mensaje) {
  const id = await preguntar(mensaje);

  if (!validarObjectId(id)) {
    console.log("Error: identificador no válido.");
    return null;
  }

  return new ObjectId(id);
}

// --------------------------------------------------
// CRUD: LIBROS
// --------------------------------------------------

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

// --------------------------------------------------
// CRUD: SOCIOS
// --------------------------------------------------

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
// --------------------------------------------------
// CRUD: PRÉSTAMOS
// --------------------------------------------------

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

// --------------------------------------------------
// CONEXIÓN PRINCIPAL CON MONGODB
// --------------------------------------------------

async function main() {
  try {
    await client.connect();

    const db = client.db(
      process.env.MONGODB_DB || "biblioteca"
    );

    console.log("Conexión con MongoDB establecida correctamente.");

    await menuPrincipal(db);
  } catch (error) {
    console.error("Error en la aplicación:", error.message);
  } finally {
    await client.close();
    rl.close();
    console.log("Conexión con MongoDB cerrada.");
  }
}

main();
