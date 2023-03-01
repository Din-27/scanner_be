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
        console.log(req.body);
        const { nama_product } = req.params
        const dataJson = {
            nama_product,
            status_scan: 'belum_discan'
        };
        const response = await product.doc(nama_product).set(dataJson);
        res.send(response);
    } catch (error) {
        res.send(error);
    }
});

app.get('/scanimage/:nama_product', async (req, res) => {
    const { nama_product } = req.params
    var token = jwt.sign({ nama_product: nama_product }, 'productScanner');
    QRCode.toDataURL(token, function (err, url) {
        if (err) throw err
        res.send(`
        <div>
            <img src=${url} alt="">
            <h1>${nama_product}</h1>
        <div>
        `)
    })
})

app.get('/batal-scan/:hash', async (req, res) => {
    try {
        var decoded = jwt.verify(req.params.hash, 'productScanner')
        console.log(decoded)
        let docRef = product.doc(decoded.nama_product)
        await docRef.update({
            status_scan: 'belum discan'
        })
        return res.send({ msg: 'data berhasil di batalkan' });
    } catch (error) {
        console.log(error)
        return res.send('token invalid');
    }
})

app.get('/verify-scan/:hash', async (req, res) => {
    console.log(req.params)
    try {
        var decoded = jwt.verify(req.params.hash, 'productScanner')
        console.log(decoded)
        let docRef = product.doc(decoded.nama_product)
        await docRef.update({
            status_scan: 'sudah discan'
        })
        return res.send({ msg: 'data berhasil di scan' });
    } catch (error) {
        console.log(error)
        return res.send('token invalid');
    }
})

app.listen(process.env.PORT || 3000);

module.exports = app;