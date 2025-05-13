require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Update base path for uploads
const UPLOADS_BASE_PATH = path.join(__dirname, '..', 'uploads');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(UPLOADS_BASE_PATH, 'mascotas');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Update static file serving
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'image/*');
  next();
}, express.static(UPLOADS_BASE_PATH));

// Database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4'
});

connection.connect(error => {
  if (error) {
    console.error('Error connecting to database:', error);
    return;
  }
  console.log('Successfully connected to database');
  
  // Initialize database tables
  initializeDatabase();
});

function initializeDatabase() {
  // First create database if it doesn't exist
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`, (error) => {
    if (error) {
      console.error('Error creating database:', error);
      return;
    }

    // Select the database
    connection.query(`USE ${process.env.DB_NAME}`, (error) => {
      if (error) {
        console.error('Error selecting database:', error);
        return;
      }

      // Create mascotas table if not exists
      connection.query(`
        CREATE TABLE IF NOT EXISTS mascotas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          raza VARCHAR(100),
          tamaño VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
          edad INT,
          notas TEXT,
          usuario_id INT,
          imagen_url VARCHAR(255) DEFAULT NULL
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
      `, (error) => {
        if (error) {
          console.error('Error creating mascotas table:', error);
          return;
        }

        // Create servicios table if not exists
        connection.query(`
          CREATE TABLE IF NOT EXISTS servicios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            duracion INT,
            precio DECIMAL(10,2),
            descripcion TEXT
          ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
        `, (error) => {
          if (error) {
            console.error('Error creating servicios table:', error);
            return;
          }

          // Create paseos table if not exists
          connection.query(`
            CREATE TABLE IF NOT EXISTS paseos (
              id INT AUTO_INCREMENT PRIMARY KEY,
              usuario_id INT,
              mascota_id INT,
              paseador_id INT,
              servicio_id INT,
              fecha DATETIME,
              estado VARCHAR(50),
              comprobante_xml TEXT
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
          `, (error) => {
            if (error) {
              console.error('Error creating paseos table:', error);
              return;
            }

            // Add test services if none exist
            connection.query('SELECT COUNT(*) as count FROM servicios', (error, results) => {
              if (!error && results[0].count === 0) {
                const testServices = [
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
                  }
                ];
                
                testServices.forEach(service => {
                  connection.query('INSERT INTO servicios SET ?', service);
                });
              }
            });
          });
        });
      });
    });
  });
}

// Add this after database connection to ensure the uploads directory exists
const uploadDir = './uploads/mascotas';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// API Routes
app.get('/api/mascotas', (req, res) => {
  const query = `
    SELECT 
      id,
      nombre,
      raza,
      tamaño as tamano,
      edad,
      notas,
      usuario_id,
      imagen_url
    FROM mascotas`;
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching mascotas:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    const mascotasWithUrls = results.map(mascota => ({
      ...mascota,
      imagen_url: mascota.imagen_url ? `http://localhost:3000${mascota.imagen_url}` : null
    }));
    res.json(mascotasWithUrls);
  });
});

app.get('/api/servicios', (req, res) => {
  const query = 'SELECT * FROM servicios';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching servicios:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Update mascotas POST endpoint
app.post('/api/mascotas', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, raza, tamano = 'mediano', edad = 0, notas = '' } = req.body;
    let imagen_url = null;

    if (req.file) {
      // Store the relative path in the database
      imagen_url = `/uploads/mascotas/${req.file.filename}`;
    }

    const query = `
      INSERT INTO mascotas (nombre, raza, tamaño, edad, notas, usuario_id, imagen_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, raza, tamano, edad, notas, 1, imagen_url];

    const [result] = await connection.promise().query(query, values);
    
    const [newMascota] = await connection.promise().query(
      'SELECT *, tamaño as tamano FROM mascotas WHERE id = ?', 
      [result.insertId]
    );

    // Add full URL for response
    const mascotaWithFullUrl = {
      ...newMascota[0],
      imagen_url: imagen_url ? `http://localhost:3000${imagen_url}` : null
    };

    res.status(201).json(mascotaWithFullUrl);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update the PUT endpoint
app.put('/api/mascotas/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, raza, tamano, edad, notas } = req.body;
    let imagen_url = null;

    if (req.file) {
      // Store only the relative path
      imagen_url = `/uploads/mascotas/${req.file.filename}`;
    }

    const query = `
      UPDATE mascotas 
      SET nombre = ?, 
          raza = ?, 
          tamaño = ?, 
          edad = ?, 
          notas = ?
          ${imagen_url ? ', imagen_url = ?' : ''}
      WHERE id = ?
    `;

    const values = imagen_url ? 
      [nombre, raza, tamano, edad, notas, imagen_url, id] :
      [nombre, raza, tamano, edad, notas, id];

    await connection.promise().query(query, values);
    
    const [updatedMascota] = await connection.promise().query(
      'SELECT *, tamaño as tamano FROM mascotas WHERE id = ?',
      [id]
    );

    // Add full URL for the response
    const mascotaWithFullUrl = {
      ...updatedMascota[0],
      imagen_url: imagen_url ? `http://localhost:3000${imagen_url}` : null
    };

    res.json(mascotaWithFullUrl);
  } catch (error) {
    console.error('Error updating mascota:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  const { nombre, duracion, precio, descripcion, imagen } = req.body;
  connection.query(
    'INSERT INTO servicios (nombre, duracion, precio, descripcion, imagen) VALUES (?, ?, ?, ?, ?)',
    [nombre, duracion, precio, descripcion, imagen],
    (error, result) => {
      if (error) {
        console.error('Error adding servicio:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: result.insertId, nombre, duracion, precio, descripcion, imagen });
    }
  );
});

// Add Stripe integration

app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'mxn',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Stripe Checkout endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  const { servicio, mascotaId } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: servicio.nombre,
              description: `Paseo para mascota ID: ${mascotaId}`
            },
            unit_amount: servicio.precio * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:4200/confirmacion?session_id={CHECKOUT_SESSION_ID}&servicio_id=${servicio.id}&mascota_id=${mascotaId}`,
      cancel_url: 'http://localhost:4200/paseos',
      metadata: {
        servicio_id: servicio.id,
        mascota_id: mascotaId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add paseo creation endpoint
app.post('/api/paseos/create-from-payment', async (req, res) => {
  const { session_id, servicio_id, mascota_id } = req.body;

  try {
    // Get service details first
    const [servicios] = await connection.promise().query(
      'SELECT * FROM servicios WHERE id = ?',
      [servicio_id]
    );

    if (!servicios || servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const servicio = servicios[0];
    const precio = Number(servicio.precio);

    // Create paseo record
    const [result] = await connection.promise().query(
      `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
       VALUES (?, ?, 1, NOW(), 'completado', ?)`,
      [1, mascota_id, servicio_id]
    );

    // Generate invoice XML
    const xmlContent = generateInvoiceXML({
      folio: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
      fecha: new Date().toISOString(),
      monto: precio,
      servicio_nombre: servicio.nombre,
      duracion: servicio.duracion
    });

    // Update paseo with XML
    await connection.promise().query(
      'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
      [xmlContent, result.insertId]
    );

    res.json({ 
      success: true, 
      paseo_id: result.insertId,
      xml: xmlContent 
    });
  } catch (error) {
    console.error('Error creating paseo:', error);
    res.status(500).json({ error: error.message || 'Error creating paseo' });
  }
});

function generateInvoiceXML(data) {
  const monto = Number(data.monto);
  const iva = monto * 0.16;
  const total = monto + iva;
  const uuid = 'a1b2c3d4-' + Math.random().toString(36).substring(2, 15);

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
  SubTotal="${monto.toFixed(2)}"
  Moneda="MXN"
  Total="${total.toFixed(2)}"
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
      Descripcion="Servicio de paseo de perro - ${data.servicio_nombre} - Duración: ${data.duracion} minutos - Fecha: ${data.fecha.split('T')[0]}"
      ValorUnitario="${monto.toFixed(2)}"
      Importe="${monto.toFixed(2)}"
      ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${monto.toFixed(2)}"
            Impuesto="002"
            TipoFactor="Tasa"
            TasaOCuota="0.160000"
            Importe="${iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
 
  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${monto.toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
 
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital
      xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"
      Version="1.1"
      UUID="${uuid}"
      FechaTimbrado="${new Date().toISOString()}"
      SelloCFD="XXX"
      NoCertificadoSAT="00001000000504465028"
      SelloSAT="XXX"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
}

app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add XML generation and storage endpoint
app.post('/api/generate-invoice', async (req, res) => {
  try {
    const { paseoId, servicioId, mascotaId, monto } = req.body;
    const fecha = new Date().toISOString();
    const folio = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Generate XML content
    const xmlContent = generateInvoiceXML({
      folio,
      fecha,
      monto,
      servicioId,
      mascotaId
    });

    // Store in database
    const query = `
      UPDATE paseos 
      SET comprobante_xml = ? 
      WHERE id = ?`;
    
    await connection.promise().query(query, [xmlContent, paseoId]);

    // Return both XML content and file URL
    res.json({
      xml: xmlContent,
      folio: folio
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to create sample invoices
app.post('/api/facturas/generate-samples', async (req, res) => {
  try {
    // Create two sample paseos with invoices
    const samplePaseos = [
      {
        servicio_id: 2,
        mascota_id: 1,
        monto: 250.00,
        servicio_nombre: 'Paseo Estándar'
      },
      {
        servicio_id: 3,
        mascota_id: 1,
        monto: 350.00,
        servicio_nombre: 'Paseo Premium'
      }
    ];

    for (const paseo of samplePaseos) {
      const [result] = await connection.promise().query(
        `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
         VALUES (1, ?, 1, NOW(), 'completado', ?)`,
        [paseo.mascota_id, paseo.servicio_id]
      );

      const xmlContent = generateInvoiceXML(paseo);
      
      await connection.promise().query(
        'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
        [xmlContent, result.insertId]
      );
    }

    res.json({ message: 'Sample invoices created successfully' });
  } catch (error) {
    console.error('Error creating sample invoices:', error);
    res.status(500).json({ error: 'Error creating sample invoices' });
  }
});

// Add route to get facturas
app.get('/api/facturas', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.fecha,
      s.nombre as servicio_nombre,
      s.precio as monto,
      p.estado,
      p.comprobante_xml
    FROM paseos p
    JOIN servicios s ON p.servicio_id = s.id
    JOIN mascotas m ON p.mascota_id = m.id
    WHERE p.estado = 'completado'
    ORDER BY p.fecha DESC
  `;
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching facturas:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    res.json(results || []);
  });
});

// Add DELETE endpoint for mascotas
app.delete('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  
  // First delete associated file if exists
  connection.query('SELECT imagen FROM mascotas WHERE id = ?', [id], (err, results) => {
    if (results?.[0]?.imagen) {
      const filePath = path.join(__dirname, results[0].imagen);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Then delete from database
    connection.query('DELETE FROM mascotas WHERE id = ?', [id], (error) => {
      if (error) {
        console.error('Error deleting mascota:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'Mascota deleted successfully' });
    });
  });
});

// Add sample paseos endpoint
app.post('/api/sample-paseos', async (req, res) => {
  try {
    const [servicios] = await connection.promise().query('SELECT * FROM servicios');
    const [mascotas] = await connection.promise().query('SELECT id FROM mascotas LIMIT 1');
    const mascotaId = mascotas[0]?.id || 1;

    for (const servicio of servicios) {
      // Create paseo record
      const [result] = await connection.promise().query(
        `INSERT INTO paseos (usuario_id, mascota_id, paseador_id, fecha, estado, servicio_id) 
         VALUES (?, ?, 1, NOW(), 'completado', ?)`,
        [1, mascotaId, servicio.id]
      );

      const xmlContent = generateInvoiceXML({
        folio: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        fecha: new Date().toISOString(),
        monto: servicio.precio,
        servicio_nombre: servicio.nombre,
        duracion: servicio.duracion,
        mascota_id: mascotaId
      });

      await connection.promise().query(
        'UPDATE paseos SET comprobante_xml = ? WHERE id = ?',
        [xmlContent, result.insertId]
      );
    }

    res.json({ message: 'Sample paseos created successfully' });
  } catch (error) {
    console.error('Error creating sample paseos:', error);
    res.status(500).json({ error: 'Error creating sample paseos' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});