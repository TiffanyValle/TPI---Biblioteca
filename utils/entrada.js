// --------------------------------------------------
// CONFIGURACIÓN
// --------------------------------------------------

const { ObjectId } = require("mongodb");
const { createInterface } = require("node:readline/promises");
const { stdin, stdout } = require("node:process");


const rl = createInterface({ input: stdin, output: stdout });

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

module.exports = { preguntar, validarObjectId, obtenerId, cerrarEntrada: () => rl.close() };
