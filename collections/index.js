const { db } = require("../db/db.config")

module.exports = {
    product: db.collection('products')
}