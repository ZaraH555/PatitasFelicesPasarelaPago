require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'patitas_felices'
});

async function initDatabase() {
  try {
    // Create default user
    await connection.promise().query(`
      INSERT IGNORE INTO usuarios (id, nombre, apellido, correo, contraseña, rol)
      VALUES (1, 'Usuario', 'Default', 'default@example.com', 'password', 'dueño')
    `);

    // Add imagen column to mascotas if it doesn't exist
    await connection.promise().query(`
      ALTER TABLE mascotas 
      MODIFY COLUMN tamaño VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
      ADD COLUMN IF NOT EXISTS imagen VARCHAR(255) DEFAULT NULL
    `);

    // Insert test services if none exist
    const [rows] = await connection.promise().query('SELECT COUNT(*) as count FROM servicios');
    
    if (rows[0].count === 0) {
      const services = [
        {
          nombre: 'Paseo Básico',
          duracion: 30,
          precio: 150.00,
          descripcion: 'Paseo de 30 minutos'
        },
        {
          nombre: 'Paseo Estándar',
          duracion: 60,
          precio: 250.00,
          descripcion: 'Paseo de 1 hora'
        },
        {
          nombre: 'Paseo Premium',
          duracion: 90,
          precio: 350.00,
          descripcion: 'Paseo de 1 hora y media'
        }
      ];

      for (const service of services) {
        const [result] = await connection.promise().query('INSERT INTO servicios SET ?', service);
        
        // Create a sample completed paseo with factura for each service
        const paseo = {
          usuario_id: 1,
          mascota_id: 1,
          paseador_id: 1,
          fecha: new Date(),
          estado: 'completado',
          servicio_id: result.insertId
        };

        const [paseoResult] = await connection.promise().query('INSERT INTO paseos SET ?', paseo);

        // Generate sample XML for each paseo
        const xmlContent = generateSampleXML({
          folio: `${result.insertId}${Math.floor(Math.random() * 10000)}`,
          fecha: new Date().toISOString(),
          monto: service.precio,
          servicio: service.nombre,
          duracion: service.duracion
        });

        await connection.promise().query(
          'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
          [xmlContent, paseoResult.insertId]
        );
      }
    }

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

function generateSampleXML(data) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
  Version="4.0"
  Serie="A"
  Folio="${data.folio}"
  Fecha="${data.fecha}"
  FormaPago="01"
  SubTotal="${data.monto.toFixed(2)}"
  Moneda="MXN"
  Total="${(data.monto * 1.16).toFixed(2)}"
  TipoDeComprobante="I"
  MetodoPago="PUE"
  LugarExpedicion="44100">
  <cfdi:Emisor
    Rfc="PPE250101XX1"
    Nombre="Patitas Felices"
    RegimenFiscal="601"/>
  <cfdi:Receptor
    Rfc="XAXX010101000"
    Nombre="Cliente General"
    DomicilioFiscalReceptor="44100"
    RegimenFiscalReceptor="616"
    UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto
      ClaveProdServ="90111501"
      Cantidad="1"
      ClaveUnidad="E48"
      Unidad="Servicio"
      Descripcion="Servicio de paseo de perro - ${data.servicio} - Duración: ${data.duracion} minutos"
      ValorUnitario="${data.monto.toFixed(2)}"
      Importe="${data.monto.toFixed(2)}"
      ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${data.monto.toFixed(2)}"
            Impuesto="002"
            TipoFactor="Tasa"
            TasaOCuota="0.160000"
            Importe="${(data.monto * 0.16).toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${(data.monto * 0.16).toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${data.monto.toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${(data.monto * 0.16).toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;
}

initDatabase();
