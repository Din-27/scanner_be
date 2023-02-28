var express = require('express')
var app = express()
var port = process.env.PORT || 8080
var bodyParser = require('body-parser');
var http = require("http")
const server = http.createServer(app);
var cors = require('cors');
require('dotenv').config()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const { db } = require('./db/db.config');
var jwt = require('jsonwebtoken');
var QRCode = require('qrcode')

const { product } = require('./collections');

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
})

app.post('/create', async (req, res) => {
    try {
        console.log(req.body);
        const { nama_product, status_scan } = req.body
        const dataJson = {
            nama_product,
            status_scan
        };
        const response = await product.doc(nama_product).set(dataJson);
        res.send(response);
    } catch (error) {
        res.send(error);
    }
});

app.get('/scanimage', async (req, res) => {
    let product = [], code128 = []
    const getProductDetail = await db.collection('products').get()
    if (getProductDetail.docs.length > 0) {
        for (const user of getProductDetail.docs) {
            product.push(user.data())
        }
    }
    var token = jwt.sign({ nama_product: product[0].nama_product }, 'productScanner');
    QRCode.toDataURL(`http://localhost:8080/scan/${token}`, function (err, url) {
        res.send(`
        <div>
            <img src=${url} alt="">
        <div>
        `)
    })
})

app.get('/batal-scan/:params', async (req, res) => {
    try {
        let docRef = product.doc(req.params.params)
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

server.listen(port, () =>
    console.log(`test:${port} || ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`));

module.exports = app