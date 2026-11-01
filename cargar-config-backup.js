const { readFileSync } = require("node:fs");
const path = require("node:path");

try {
  const dotenv = require("dotenv");
  let archivoEnv = {};

  try {
    archivoEnv = dotenv.parse(
      readFileSync(path.join(__dirname, ".env"))
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error("No se pudo leer el archivo .env del proyecto.");
    }
  }

  const uri = process.env.MONGODB_URI ?? archivoEnv.MONGODB_URI;
  const databaseName = (
    process.env.MONGODB_DB ?? archivoEnv.MONGODB_DB
  ) || "biblioteca";

  if (!uri) {
    throw new Error("MONGODB_URI no está definida en el entorno ni en .env.");
  }

  // Mantiene los caracteres Unicode al pasar JSON a Windows PowerShell.
  const configuracionJson = JSON.stringify({ uri, databaseName }).replace(
    /[\u007f-\uffff]/g,
    caracter => "\\u" + caracter.charCodeAt(0).toString(16).padStart(4, "0")
  );

  process.stdout.write(configuracionJson);
} catch (error) {
  const mensaje = error.code === "MODULE_NOT_FOUND"
    ? "No se encontró dotenv. Instala las dependencias de la aplicación."
    : error.message;

  console.error("Error al cargar la configuración del respaldo:", mensaje);
  process.exitCode = 1;
}
