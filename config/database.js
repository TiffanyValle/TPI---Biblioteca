
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const nombreBD = process.env.MONGODB_DB || "biblioteca";
let client;

async function conectarBD() {
    if (!uri) {
        throw new Error("Falta configurar MONGODB_URI en el archivo .env");
    }

    client = new MongoClient(uri);
    try {
        await client.connect();

        const db = client.db(nombreBD);
        await db.command({ ping: 1 });

        return db;
        console.log("¡Conexión correcta con MongoDB Atlas!");

    } catch (error) {
        await cerrarBD();
        throw error;
    }
}

async function cerrarBD() {
    if (client) {
        try {
            await client.close();
        } finally {
            client = undefined;
        }
    }
}

module.exports = { conectarBD, cerrarBD };
