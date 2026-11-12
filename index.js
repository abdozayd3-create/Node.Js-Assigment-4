Part 3:

1- CREATE TABLE Suppliers (
    SupplierID INT AUTO_INCREMENT PRIMARY KEY,
    SupplierName TEXT NOT NULL,
    ContactNumber TEXT
);

2- CREATE TABLE Products (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    ProductName TEXT NOT NULL,
    Price DECIMAL(10,2),
    StockQuantity INT,
    SupplierID INT,
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
);

3- CREATE TABLE Sales (
    SaleID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    QuantitySold INT,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);


part 4

1- const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'retail_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
    await connection.query('CREATE DATABASE IF NOT EXISTS retail_store;');
    await connection.end();

    const conn = await pool.getConnection();
    await conn.query(`CREATE TABLE IF NOT EXISTS Suppliers (SupplierID INT AUTO_INCREMENT PRIMARY KEY, SupplierName TEXT NOT NULL, ContactNumber TEXT);`);
    await conn.query(`CREATE TABLE IF NOT EXISTS Products (ProductID INT AUTO_INCREMENT PRIMARY KEY, ProductName TEXT NOT NULL, Price DECIMAL(10,2), StockQuantity INT, SupplierID INT, FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID));`);
    await conn.query(`CREATE TABLE IF NOT EXISTS Sales (SaleID INT AUTO_INCREMENT PRIMARY KEY, ProductID INT, QuantitySold INT, FOREIGN KEY (ProductID) REFERENCES Products(ProductID));`);
    conn.release();
}
initDB();


2- app.post('/products', async (req, res) => {
    const { ProductName, Price, StockQuantity, SupplierID } = req.body;
    const [result] = await pool.query('INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES (?, ?, ?, ?)', [ProductName, Price, StockQuantity, SupplierID]);
    res.json({ message: 'Product created', ProductID: result.insertId });
});

app.get('/products', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Products');
    res.json(rows);
});

app.get('/products/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Products WHERE ProductID = ?', [req.params.id]);
    res.json(rows[0] || {});
});

app.put('/products/:id', async (req, res) => {
    const { ProductName, Price, StockQuantity, SupplierID } = req.body;
    await pool.query('UPDATE Products SET ProductName = ?, Price = ?, StockQuantity = ?, SupplierID = ? WHERE ProductID = ?', [ProductName, Price, StockQuantity, SupplierID, req.params.id]);
    res.json({ message: 'Product updated' });
});

app.delete('/products/:id', async (req, res) => {
    await pool.query('DELETE FROM Products WHERE ProductID = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
});


3- app.post('/suppliers', async (req, res) => {
    const { SupplierName, ContactNumber } = req.body;
    const [result] = await pool.query('INSERT INTO Suppliers (SupplierName, ContactNumber) VALUES (?, ?)', [SupplierName, ContactNumber]);
    res.json({ message: 'Supplier created', SupplierID: result.insertId });
});

app.get('/suppliers', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Suppliers');
    res.json(rows);
});

app.put('/suppliers/:id', async (req, res) => {
    const { SupplierName, ContactNumber } = req.body;
    await pool.query('UPDATE Suppliers SET SupplierName = ?, ContactNumber = ? WHERE SupplierID = ?', [SupplierName, ContactNumber, req.params.id]);
    res.json({ message: 'Supplier updated' });
});

app.delete('/suppliers/:id', async (req, res) => {
    await pool.query('DELETE FROM Suppliers WHERE SupplierID = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
});

4- app.post('/sales', async (req, res) => {
    const { ProductID, QuantitySold } = req.body;
    const [result] = await pool.query('INSERT INTO Sales (ProductID, QuantitySold) VALUES (?, ?)', [ProductID, QuantitySold]);
    res.json({ message: 'Sale recorded', SaleID: result.insertId });
});

app.get('/sales', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Sales');
    res.json(rows);
});

app.get('/products/:id/sales', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Sales WHERE ProductID = ?', [req.params.id]);
    res.json(rows);
});


5- app.post('/db-modifications', async (req, res) => {
    await pool.query('ALTER TABLE Products ADD COLUMN Category VARCHAR(255);');
    await pool.query('ALTER TABLE Products DROP COLUMN Category;');
    await pool.query('ALTER TABLE Suppliers MODIFY COLUMN ContactNumber VARCHAR(15);');
    await pool.query('ALTER TABLE Products MODIFY COLUMN ProductName VARCHAR(255) NOT NULL;');
    res.json({ message: 'Modifications applied' });
});


6- app.post('/seed-data', async (req, res) => {
    const [sup] = await pool.query('INSERT INTO Suppliers (SupplierName, ContactNumber) VALUES (?, ?)', ['FreshFoods', '01001234567']);
    const supplierId = sup.insertId;

    await pool.query(`
        INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES 
        ('Milk', 15.00, 50, ?),
        ('Bread', 10.00, 30, ?),
        ('Eggs', 20.00, 40, ?)
    `, [supplierId, supplierId, supplierId]);

    const [milk] = await pool.query('SELECT ProductID FROM Products WHERE ProductName = "Milk"');
    if(milk.length > 0) {
        await pool.query('INSERT INTO Sales (ProductID, QuantitySold) VALUES (?, ?)', [milk[0].ProductID, 2]);
    }

    res.json({ message: 'Seed data inserted' });
});


7- app.put('/update-bread-price', async (req, res) => {
    await pool.query('UPDATE Products SET Price = 25.00 WHERE ProductName = "Bread"');
    res.json({ message: 'Bread price updated to 25.00' });
});


8- app.delete('/delete-eggs', async (req, res) => {
    await pool.query('DELETE FROM Products WHERE ProductName = "Eggs"');
    res.json({ message: 'Eggs deleted' });
});


9- app.get('/reports/total-sold', async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.ProductName, SUM(s.QuantitySold) AS TotalSold
        FROM Products p
        LEFT JOIN Sales s ON p.ProductID = s.ProductID
        GROUP BY p.ProductID, p.ProductName
    `);
    res.json(rows);
});


10- app.get('/reports/highest-stock', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Products ORDER BY StockQuantity DESC LIMIT 1');
    res.json(rows[0] || {});
});


11- app.get('/reports/suppliers-f', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Suppliers WHERE SupplierName LIKE "F%"');
    res.json(rows);
});


12- app.get('/reports/never-sold', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Products WHERE ProductID NOT IN (SELECT DISTINCT ProductID FROM Sales WHERE ProductID IS NOT NULL)');
    res.json(rows);
});


13-app.get('/reports/sales-details', async (req, res) => {
    const [rows] = await pool.query(`
        SELECT p.ProductName, s.QuantitySold, s.SaleDate
        FROM Sales s
        JOIN Products p ON s.ProductID = p.ProductID
    `);
    res.json(rows);
});

14- CREATE USER 'store_manager'@'localhost' IDENTIFIED BY 'password123';
GRANT SELECT, INSERT, UPDATE ON retail_store.* TO 'store_manager'@'localhost';


15- REVOKE UPDATE ON retail_store.* FROM 'store_manager'@'localhost';


16-GRANT DELETE ON retail_store.Sales TO 'store_manager'@'localhost';
FLUSH PRIVILEGES;

