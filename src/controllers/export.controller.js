const archiver = require("archiver");
const { generarCSVs } = require("../services/export.service");
const { exportarImagenesPorCarpeta } = require("../services/storage.service");

// =========================
// 📄 EXPORTAR SOLO CSV
// =========================
const exportarTodosCSV = async (req, res) => {
  try {
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=csv-gorrioncito.zip"
    );

    archive.pipe(res);

    const { productos, categorias, marcas } = await generarCSVs();

    archive.append(productos, { name: "productos.csv" });
    archive.append(categorias, { name: "categorias.csv" });
    archive.append(marcas, { name: "marcas.csv" });

    await archive.finalize();
  } catch (err) {
    console.error("Error exportando CSV:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 📦 BACKUP COMPLETO
// =========================
const exportarBaseDeDatosGorrioncito = async (req, res) => {
  try {
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=BaseDeDatosGorrioncito.zip"
    );

    archive.pipe(res);

    // 📄 CSV
    const { productos, categorias, marcas } = await generarCSVs();

    archive.append(productos, { name: "csv/productos.csv" });
    archive.append(categorias, { name: "csv/categorias.csv" });
    archive.append(marcas, { name: "csv/marcas.csv" });

    // 🖼️ IMÁGENES
    await exportarImagenesPorCarpeta("producto", archive);
    await exportarImagenesPorCarpeta("categoria", archive);
    await exportarImagenesPorCarpeta("marca", archive);

    await archive.finalize();
  } catch (err) {
    console.error("Error exportando backup completo:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  exportarTodosCSV,
  exportarBaseDeDatosGorrioncito
};