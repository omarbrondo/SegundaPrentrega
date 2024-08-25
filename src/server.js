const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Función para leer productos del archivo
const getProducts = () => {
    const data = fs.readFileSync(path.join(__dirname, 'productos.json'), 'utf-8');
    return JSON.parse(data);
};

// Configuración de Handlebars
app.engine('handlebars', engine({
    layoutsDir: false, // Desactiva los layouts
    defaultLayout: false // Asegúrate de que no haya un layout por defecto
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Rutas de la API
app.use('/api/products', require('./routes/products')(io)); // Pasar io aquí
app.use('/api/carts', require('./routes/carts'));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para renderizar las vistas
app.get('/home', (req, res) => {
    const products = getProducts(); // Leer productos desde el archivo
    res.render('home', { products }); // Renderiza directamente 'home.handlebars'
});

app.get('/realtimeproducts', (req, res) => {
    const products = getProducts(); // Leer productos desde el archivo
    res.render('realTimeProducts', { products }); // Renderiza directamente 'realTimeProducts.handlebars'
});

// Socket.io: Configuración básica
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('newProduct', (product) => {
        const products = getProducts();
        const newProduct = {
            id: String(products.length + 1),
            title: product.title,
            price: product.price
        };
        products.push(newProduct);
        fs.writeFileSync(path.join(__dirname, 'productos.json'), JSON.stringify(products, null, 2));
        io.emit('productUpdated', newProduct);
    });

    socket.on('deleteProduct', (productId) => {
        let products = getProducts();
        products = products.filter(p => p.id !== productId);
        fs.writeFileSync(path.join(__dirname, 'productos.json'), JSON.stringify(products, null, 2));
        io.emit('productDeleted', productId);
    });
});

const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
