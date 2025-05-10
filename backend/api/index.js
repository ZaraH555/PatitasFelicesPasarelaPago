const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// In-memory array for testing (replace with your database)
let productos = [
  // your initial products
];

// GET all products
app.get('/api/productos', (req, res) => {
  res.json(productos);
});

// GET single product
app.get('/api/productos/:id', (req, res) => {
  const producto = productos.find(p => p.id === parseInt(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

// PUT update product
app.put('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  productos[index] = { ...productos[index], ...req.body, id };
  res.json(productos[index]);
});

// POST new product
app.post('/api/productos', (req, res) => {
  const producto = {
    id: productos.length + 1,
    ...req.body
  };
  productos.push(producto);
  res.status(201).json(producto);
});

// DELETE product
app.delete('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  productos.splice(index, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});