const express = require('express');
const router = express.Router();
const fs = require('fs');

const cartsFile = './carrito.json';


const getCarts = () => {
    const data = fs.readFileSync(cartsFile, 'utf-8');
    return JSON.parse(data);
};


const saveCarts = (carts) => {
    fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2));
};


router.post('/', (req, res) => {
    const carts = getCarts();
    const newCart = {
        id: String(carts.length + 1),
        products: []
    };
    carts.push(newCart);
    saveCarts(carts);
    res.status(201).json(newCart);
});


router.get('/:cid', (req, res) => {
    const carts = getCarts();
    const cart = carts.find(c => c.id === req.params.cid);
    if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart.products);
});


router.post('/:cid/product/:pid', (req, res) => {
    const carts = getCarts();
    const cart = carts.find(c => c.id === req.params.cid);
    if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    const productIndex = cart.products.findIndex(p => p.product === req.params.pid);
    if (productIndex !== -1) {
        cart.products[productIndex].quantity += 1;
    } else {
        cart.products.push({ product: req.params.pid, quantity: 1 });
    }
    saveCarts(carts);
    res.json(cart);
});

module.exports = router;
