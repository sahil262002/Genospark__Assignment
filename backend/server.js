
const express = require('express');
require('dotenv').config();   
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: true } 
};



const pool = require("./db.js");



const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};


app.get('/api/products', async (req, res) => {
  try {
    const { status, includeDeleted = 'false', live = 'false' } = req.query;
    
    let query = 'SELECT * FROM Products WHERE 1=1';
    const params = [];

    if (live === 'true') {
      query += ' AND status = ? AND is_deleted = FALSE';
      params.push('Published');
    } else {
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      if (includeDeleted !== 'true') {
        query += ' AND is_deleted = FALSE';
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});


app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM Products WHERE product_id = ? AND is_deleted = FALSE',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});


app.post('/api/products', async (req, res) => {
  try {
    const { product_name, product_desc, status = 'Draft', created_by } = req.body;
    
    // Validation
    if (!product_name || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'Product name and created_by are required'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO Products (product_name, product_desc, status, created_by) VALUES (?, ?, ?, ?)',
      [product_name, product_desc, status, created_by]
    );
    
    
    const [newProduct] = await pool.execute(
      'SELECT * FROM Products WHERE product_id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});


app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, product_desc, status, updated_by } = req.body;
    
    // Validation
    if (!updated_by) {
      return res.status(400).json({
        success: false,
        message: 'updated_by is required'
      });
    }
    

    const [existingProduct] = await pool.execute(
      'SELECT * FROM Products WHERE product_id = ? AND is_deleted = FALSE',
      [id]
    );
    
    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
   
    const updateFields = [];
    const params = [];
    
    if (product_name !== undefined) {
      updateFields.push('product_name = ?');
      params.push(product_name);
    }
    if (product_desc !== undefined) {
      updateFields.push('product_desc = ?');
      params.push(product_desc);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    updateFields.push('updated_by = ?');
    params.push(updated_by);
    params.push(id);
    
    const query = `UPDATE Products SET ${updateFields.join(', ')} WHERE product_id = ?`;
    
    await pool.execute(query, params);
    
   
    const [updatedProduct] = await pool.execute(
      'SELECT * FROM Products WHERE product_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by } = req.body;
    
    if (!updated_by) {
      return res.status(400).json({
        success: false,
        message: 'updated_by is required for deletion'
      });
    }
    

    const [existingProduct] = await pool.execute(
      'SELECT * FROM Products WHERE product_id = ? AND is_deleted = FALSE',
      [id]
    );
    
    if (existingProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    

    await pool.execute(
      'UPDATE Products SET is_deleted = TRUE, updated_by = ? WHERE product_id = ?',
      [updated_by, id]
    );
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});


app.post('/api/products/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by } = req.body;
    
    if (!updated_by) {
      return res.status(400).json({
        success: false,
        message: 'updated_by is required for restoration'
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE Products SET is_deleted = FALSE, updated_by = ? WHERE product_id = ?',
      [updated_by, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product restored successfully'
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore product',
      error: error.message
    });
  }
});


app.get('/api/products/live', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT product_id, product_name, product_desc FROM Products WHERE status = ? AND is_deleted = FALSE ORDER BY created_at DESC',
      ['Published']
    );
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching live products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live products',
      error: error.message
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as health_check');
    res.json({
      success: true,
      message: 'Server and database are healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});


app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});



app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
  console.log(`API endpoints available:
  GET    /api/products          - Fetch all products (admin)
  GET    /api/products/live     - Fetch published products (public)
  GET    /api/products/:id      - Fetch single product
  POST   /api/products          - Create new product
  PUT    /api/products/:id      - Update product
  DELETE /api/products/:id      - Soft delete product
  POST   /api/products/:id/restore - Restore deleted product
  GET    /api/health            - Health check`);
});

module.exports = app;