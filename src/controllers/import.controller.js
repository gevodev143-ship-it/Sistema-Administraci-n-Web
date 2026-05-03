const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");

const { procesarArchivosExcel } = require("../services/import.service");

const importExcelBd = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }

    const nombreOriginal = file.originalname;

    if (!nombreOriginal.startsWith("BaseDeDatosGorrioncito")) {
      return res.status(400).json({
        error: "El archivo debe iniciar con 'BaseDeDatosGorrioncito'"
      });
    }

    const rutaZip = file.path;
    const carpetaDestino = `uploads/${Date.now()}`;

    fs.mkdirSync(carpetaDestino);

    await fs
      .createReadStream(rutaZip)
      .pipe(unzipper.Extract({ path: carpetaDestino }))
      .promise();

    const resultado = await procesarArchivosExcel(carpetaDestino);
    fs.rmSync(carpetaDestino, { recursive: true, force: true });
    res.json({
      mensaje: "Importación exitosa",
      resultado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al importar" });
  }
};

module.exports = { importExcelBd };