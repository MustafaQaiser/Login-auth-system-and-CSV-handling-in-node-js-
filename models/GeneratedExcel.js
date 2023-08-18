const mongoose = require('mongoose');

const generatedExcelSchema = new mongoose.Schema({
  filename: String,
  content: Buffer,
});

const GeneratedExcel = mongoose.model('GeneratedExcel', generatedExcelSchema);

module.exports = GeneratedExcel;
