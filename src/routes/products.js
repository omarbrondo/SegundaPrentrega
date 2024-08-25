const express = require('express');
const router = express.Router();
const fs = require('fs');

const productsFile = './productos.json';

// Función para leer productos del archivo
const getProducts = () => {
    const data = fs.readFileSync(productsFile, 'utf-8');
    return JSON.parse(data);
};

// Función para guardar productos en el archivo
const saveProducts = (products) => {
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
};

// Función para configurar rutas con Socket.io
module.exports = (io) => {
    // Ruta para obtener todos los productos
    router.get('/', (req, res) => {
        const products = getProducts();
        const limit = req.query.limit;
        if (limit) {
            return res.json(products.slice(0, limit));
        }
        res.json(products);
    });

    // Ruta para obtener un producto por ID
    router.get('/:pid', (req, res) => {
        const products = getProducts();
        const product = products.find(p => p.id === req.params.pid);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    });

    // Ruta para crear un nuevo producto
    router.post('/', (req, res) => {
        const { title, description, code, price, stock, category } = req.body;

        // Verificar que los campos obligatorios no estén vacíos
        if (!title || !description || !code || !price || !stock || !category) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios, excepto status y thumbnails.' });
        }

        const products = getProducts();
        const newProduct = {
            id: String(products.length + 1),
            title,
            description,
            code,
            price,
            status: true,  // Status se inicializa en true
            stock,
            category,
            thumbnails: req.body.thumbnails || [],  // Thumbnails es un array vacío si no se proporciona
        };

        products.push(newProduct);
        saveProducts(products);

        // Emitir evento de nuevo producto creado a través de WebSocket
        io.emit('productUpdated', newProduct);

        res.status(201).json({ message: 'Producto creado exitosamente', product: newProduct });
    });

    // Ruta para actualizar un producto por ID
    router.put('/:pid', (req, res) => {
        const products = getProducts();
        const index = products.findIndex(p => p.id === req.params.pid);
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const updatedProduct = {
            ...products[index],
            ...req.body,
            id: products[index].id // No se puede actualizar el ID
        };
        products[index] = updatedProduct;
        saveProducts(products);
        res.json(updatedProduct);
    });

    // Ruta para eliminar un producto por ID
    router.delete('/:pid', (req, res) => {
        let products = getProducts();
        const index = products.findIndex(p => p.id === req.params.pid);
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        products = products.filter(p => p.id !== req.params.pid);
        saveProducts(products);

        // Emitir evento de producto eliminado a través de WebSocket
        io.emit('productDeleted', req.params.pid);

        res.status(204).end();
    });

    return router;
};
