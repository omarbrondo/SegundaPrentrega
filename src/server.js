const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { engine } = require('express-handlebars');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);


const getProducts = () => {
    const data = fs.readFileSync(path.join(__dirname, 'productos.json'), 'utf-8');
    return JSON.parse(data);
};


app.engine('handlebars', engine({
    layoutsDir: false, 
    defaultLayout: false 
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.use('/api/products', require('./routes/products')(io)); 
app.use('/api/carts', require('./routes/carts'));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/home', (req, res) => {
    const products = getProducts(); 
    res.render('home', { products }); 
});

app.get('/realtimeproducts', (req, res) => {
    const products = getProducts(); 
    res.render('realTimeProducts', { products }); 
});


io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('newProduct', (product) => {
        const products = getProducts();
        const newProduct = {
            id: String(products.length + 1),
            title: product.title,
            description: product.description,
            code: product.code,
            price: product.price,
            stock: product.stock,
            category: product.category,
            thumbnails: product.thumbnails

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
