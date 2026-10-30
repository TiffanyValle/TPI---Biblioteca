
require("dotenv").config();

const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("No se encontró MONGODB_URI en el archivo .env");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("¡Conexión correcta con MongoDB Atlas!");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Error de conexión:", error.message);
  process.exitCode = 1;
});
