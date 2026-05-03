CREATE TABLE logo(
  logoId SERIAL PRIMARY KEY ,
  logoNombre TEXT,
  logoBucketNombre TEXT
)

CREATE TABLE banner(
  bannerId SERIAL PRIMARY KEY,
  bannerNombre TEXT,
  bannerLink TEXT -- url externa si no usas storage
  bannerBucketNombre TEXT
);

CREATE TABLE icon (
    iconId SERIAL PRIMARY KEY,
    iconSvg TEXT,
    iconNombre VARCHAR(200)
);

CREATE TABLE cargo (
  cargoId SERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL
);
INSERT INTO cargo (nombre)
VALUES ('admin');
CREATE TABLE usuario (
  usuarioId SERIAL PRIMARY KEY,
  usuarioNombres VARCHAR(100) NOT NULL,
  usuarioApellidos VARCHAR(100) NOT NULL,
  usuarioDni VARCHAR(8) UNIQUE NOT NULL CHECK (char_length(usuarioDni) = 8),
  usuarioCorreo VARCHAR(200) UNIQUE, -- opcional
  usuarioPassword VARCHAR(200) NOT NULL,
  usuarioTelefono VARCHAR(15),  -- opcional
  usuarioTelefonoRespaldo VARCHAR(15), -- opcional
  cargoId INTEGER NOT NULL REFERENCES cargo(cargoId)
);
INSERT INTO usuario (
  usuarioNombres,
  usuarioApellidos,
  usuarioDni,
  usuarioCorreo,
  usuarioPassword,
  usuarioTelefono,
  usuarioTelefonoRespaldo,
  cargoId
)
VALUES (
  'Leonardo',
  'Veliz',
  '12345678',
  'admin@gorrioncito.com',
  '$2b$10$EjemploHash1234567890abcdefg', -- bcrypt hash
  '987654321',
  NULL,
  1
);
-- Navbar ----------------------
CREATE TABLE nbCompany(
    nbCompanyId SERIAL PRIMARY KEY,
    nbCompanyNombreCss JSONB,
    nbCompanyNombre VARCHAR(200),
    nbCompanyDescripcionCss JSONB,
    nbCompanyDescripcion VARCHAR(200)
);

CREATE TABLE navbar(
    nbId SERIAL PRIMARY KEY,
    nbCss JSONB, -- aqui estara el color del scroll y el gradient aunque dependen de boolean
    nbColorScroll BOOLEAN,
    nbGradienteScroll BOOLEAN,
    nbColor BOOLEAN ,
    logoCss JSON,
    logoId INTEGER REFERENCES logo(logoId),
    nbCompanyId INTEGER REFERENCES nbCompany(nbCompanyId),
    
);

-- seccion 1 ---------------------------------------------------------

CREATE TABLE seccion1 (
  sc1Id SERIAL PRIMARY KEY,
  sc1UsarStorage BOOLEAN, -- true = usa imagen en la pagina principal
  bannerId INTEGER REFERENCES banner(bannerId)
);

--------------  testimonios  ----------------------------------------------------
CREATE TABLE testimonio (
  testId SERIAL PRIMARY KEY,
  testMostrar BOOLEAN,
  testLink text
);


----- imagenes para los productos, categorias y marcas -------------------------------
CREATE TABLE categoria (
  ctgraId SERIAL PRIMARY KEY,
  ctgraImgNombre TEXT,
  ctgraImgNombreBucket TEXT
);

CREATE TABLE marca (
  marcaId SERIAL PRIMARY KEY,
  marcaImgNombre TEXT,
  marcaImgNombreBucket TEXT
);

CREATE TABLE producto (
  prdcId SERIAL PRIMARY KEY,
  prdcImgNombre TEXT,
  prdcImgNombreBucket TEXT,
  prdcPrecio NUMERIC(10,2),

  ctgraId INTEGER NOT NULL,
  marcaId INTEGER NOT NULL,

  CONSTRAINT fk_categoria
    FOREIGN KEY (ctgraId)
    REFERENCES categoria(ctgraId)
    ON DELETE CASCADE,

  CONSTRAINT fk_marca
    FOREIGN KEY (marcaId)
    REFERENCES marca(marcaId)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX unique_nombre_lower
ON producto (LOWER(prdcImgNombre));