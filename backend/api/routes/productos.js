const express = require('express');
const router = express.Router();
const connection = require('../db');

// Get all products
router.get('/', (req, res) => {
  connection.query('SELECT * FROM productos', (error, results) => {
    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Add new product
router.post('/', (req, res) => {
  const { nombre, precio, imagen, cantidad } = req.body;
  connection.query(
    'INSERT INTO productos (nombre, precio, imagen, cantidad) VALUES (?, ?, ?, ?)',
    [nombre, precio, imagen, cantidad],
    (error, result) => {
      if (error) {
        console.error('Error adding product:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: result.insertId, ...req.body });
    }
  );
});

// Update product
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, imagen, cantidad } = req.body;
  connection.query(
    'UPDATE productos SET nombre = ?, precio = ?, imagen = ?, cantidad = ? WHERE id = ?',
    [nombre, precio, imagen, cantidad, id],
    (error) => {
      if (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(req.body);
    }
  );
});

// Delete product
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM productos WHERE id = ?', [id], (error) => {
    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(204).send();
  });
});

module.exports = router;