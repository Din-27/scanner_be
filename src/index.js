const express = require('express');
const app = express();
const path = require('path');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var QRCode = require('qrcode');
const { product } = require('../collections');
var cors = require('cors');
const { db } = require('../db/db.config');

product
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
})

app.get('/data', async (req, res) => {
    let product = []
    const getProductDetail = await db.collection('products').get()
    if (getProductDetail.docs.length > 0) {
        for (const user of getProductDetail.docs) {
            product.push(user.data())
        }
    }
    return res.send(product);
})

app.get('/create/:nama_product', async (req, res) => {
    try {
        const { nama_product } = req.params

        let products = []
        const getProductDetail = await db.collection('products').get()
        if (getProductDetail.docs.length > 0) {
            for (const user of getProductDetail.docs) {
                products.push(user.data())
            }
        }

        const date = new Date()
        const generateKode = date.toLocaleDateString().replace(/\//gm, '')
        const kode = `KB${generateKode}${products.length + 1}`
        const dataJson = {
            nama_product,
            kode_product: kode,
            status_scan: 'belum discan'
        };
        console.log(dataJson)
        const response = await product.doc(kode).set(dataJson);
        res.send(response);
    } catch (error) {
        res.send(error);
    }
});

app.get('/edit/:kode_product/:edited', async (req, res) => {
    try {
        const { kode_product, edited } = req.params
        let docRef = product.doc(kode_product)
        await docRef.update({ nama_product: edited })
        res.send('sukses');
    } catch (error) {
        res.send(error.message);
    }
});

app.get('/delete/:kode_product', async (req, res) => {
    try {
        const response = await product.doc(req.params.kode_product).delete();
        res.send(response);
    } catch (error) {
        res.send(error);
    }
});

app.get('/scanimage/:kode_product', async (req, res) => {
    const { kode_product } = req.params
    var token = jwt.sign({ kode_product: kode_product }, 'productScanner');
    res.send(req.params)
})

app.get('/batal-scan/:kode_product', async (req, res) => {
    try {
        // var decoded = jwt.verify(req.params.hash, 'productScanner')
        // console.log(decoded)
        let docRef = product.doc(req.params.kode_product)
        await docRef.update({
            status_scan: 'belum discan'
        })
        return res.send({ msg: 'data berhasil di batalkan' });
    } catch (error) {
        console.log(error)
        return res.send('token invalid');
    }
})

app.get('/verify-scan/:kode_product', async (req, res) => {
    console.log(req.params)
    try {
        // var decoded = jwt.verify(req.params.kode_product, 'productScanner')
        // console.log(decoded)
        let docRef = product.doc(req.params.kode_product)
        await docRef.update({
            status_scan: 'sudah discan'
        })
        return res.send({ msg: 'data berhasil di scan' });
    } catch (error) {
        console.log(error)
        return res.send('token invalid');
    }
})

app.listen(process.env.PORT || 8000);

module.exports = app;