// models/stock.js

const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  sku: String,
  stock_id: String,
});

module.exports = mongoose.model('Stock', stockSchema);
