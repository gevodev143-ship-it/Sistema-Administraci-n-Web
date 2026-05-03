const express = require("express");
const router = express.Router();

const { exportarCSVCompletoMarca } = require("../controllers/marca.controller");

router.get("/exportarCSVCompletoMarca", exportarCSVCompletoMarca);

module.exports = router;
