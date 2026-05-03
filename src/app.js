const express = require("express");
const cors = require("cors");

const productoRoutes = require("./routes/producto.routes");
const marcaRoutes = require("./routes/marca.routes");
const categoriaRoutes = require("./routes/categoria.routes");

const storageRoutes = require("./routes/storage.routes");
const exportRoutes = require("./routes/export.routes");

const importRoutes = require("./routes/import.routes");



const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/crearProducto", productoRoutes);
app.use("/api/marcas", marcaRoutes);
app.use("/api/categorias", categoriaRoutes);

app.use("/api/storage", storageRoutes);
app.use("/api/export", exportRoutes);

app.use("/api/import", importRoutes);

module.exports = app;
