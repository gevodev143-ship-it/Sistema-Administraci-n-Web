const archiver = require("archiver");

const { generarBackup, exportarImagenesPorCarpeta } = require("../services/storage.service");

// ----------------------------------------------------
// EXPORT POR CARPETA
// ----------------------------------------------------
const exportarPorCarpeta = async (req, res) => {
  try {
    const { tipo } = req.params;

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${tipo}.zip`
    );

    archive.pipe(res);

    await exportarImagenesPorCarpeta(tipo, archive);

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------
// EXPORT TODO
// ----------------------------------------------------
const exportarTodoCarpetas = async (req, res) => {
  try {
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=backup-completo.zip"
    );

    archive.pipe(res);

    await exportarImagenesPorCarpeta("producto", archive);
    await exportarImagenesPorCarpeta("categoria", archive);
    await exportarImagenesPorCarpeta("marca", archive);

    await archive.finalize();
  } catch (err) {
    console.error("Error exportando todo:", err);
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  exportarTodoCarpetas,
  exportarPorCarpeta
}; 