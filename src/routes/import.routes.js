const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { importExcelBd } = require("../controllers/import.controller");

router.post("/bd", upload.single("archivo"), importExcelBd);

module.exports = router;