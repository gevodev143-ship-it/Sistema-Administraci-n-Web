const convertirAExcelCSV = (datos) => {
  if (!datos || datos.length === 0) return "";

  // columnas (headers)
  const headers = Object.keys(datos[0]).join(",");

  // filas
  const rows = datos.map((item) =>
    Object.values(item)
      .map((value) => `"${value}"`)
      .join(",")
  );

  // unir todo
  return [headers, ...rows].join("\n");
};

module.exports = { convertirAExcelCSV };