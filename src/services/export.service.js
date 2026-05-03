// services/export.service.js
const { listarCategorias } = require("./categoria.service");
const { listarProductos } = require("./producto.service");
const { listarMarcas } = require("./marca.service");
const { convertirAExcelCSV } = require("../utils/convertToCsv");

const generarCSVs = async () => {
  const [productos, categorias, marcas] = await Promise.all([
    listarProductos(),
    listarCategorias(),
    listarMarcas()
  ]);

  return {
    productos: convertirAExcelCSV(productos),
    categorias: convertirAExcelCSV(categorias),
    marcas: convertirAExcelCSV(marcas)
  };
};

module.exports = { generarCSVs };