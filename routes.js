
const express = require('express');
const router = express.Router();
const User = require('./models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const Stock = require('./models/stock');
const csvParser = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const GeneratedExcel = require('./models/GeneratedExcel');
const { Parser } = require('json2csv');
const upload = multer({ dest: 'uploading/' }); 
const csvWriter = require('csv-writer').createObjectCsvWriter;
const exceljs = require('exceljs');
const excel4node = require('excel4node');

// ...
const JWT_SECRET='mynameismustafa'
// Signup API
router.post('/SignUp', async (req, res) => {

try {
    const isAdded = await User.findOne({ email: req.body.email });
    if (isAdded) {
      const success= false;
      return res.send({
        message: "This Email already Added!",
        success
      });
    
    } 
    
   
    else {
      const salt = await bcrypt.genSalt(10);
      const secPass= await bcrypt.hash(req.body.password,salt) ;
      
      const newUser = new User({
        name:req.body.name,
        email: req.body.email,
        password: secPass,
        confirm_password:secPass
      });
      const user = await newUser.save();
      const success= true;
      res.send({
        
        success
        
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }



  });

  router.post('/Login', async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password)
      if (user && isPasswordValid ) {
        const data = {
          user: {id: user.id}
         }
         const token = jwt.sign(data, JWT_SECRET,  { expiresIn: '1h' })
         
     
        res.json(
          
         {token},
         
        );
      } else {
        const success=false;
        res.send({
          success,
          message: "Invalid Email or password!",
        });
      }
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  });

  // Import CSV and generate output
  router.post('/importCSV', upload.single('sample1'), async (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', async () => {
      try {
        const savedStocks = await Promise.all(results.map(async (row) => {
          try {
            const savedStock = await Stock.create({
              sku: row.variant,
              stock_id: row.stock
            });
            return savedStock;
          } catch (error) {
            console.error('Error saving stock:', error);
            return null;
          }
        }));
  
        // Filter out null values in case of errors
        const filteredStocks = savedStocks.filter(stock => stock !== null);
        console.log(filteredStocks);
  
        res.json({ message: 'CSV data imported and saved successfully.' });
      } catch (error) {
        console.error('Error importing CSV data:', error);
        res.status(500).json({ error: 'An error occurred while importing CSV data.' });
      }
    });

});

// router.get('/exportAndClearStocks', async (req, res) => {
//   try {
//     // Retrieve all data from the Stock collection
//     const allStocks = await Stock.find();

//     // Create a CSV writer to generate the CSV file
//     const csvWriterInstance = csvWriter({
//       path: 'exported_stocks.csv',
//       header: [
//         { id: 'sku', title: 'SKU' },
//         { id: 'stock_id', title: 'Stock ID' }
//       ]
//     });

//     // Write the data to the CSV file
//     await csvWriterInstance.writeRecords(allStocks);

//     // Clear the Stock collection
//     await Stock.deleteMany();

//     // Send the generated CSV file for download
//     res.download('exported_stocks.csv', (err) => {
//       if (err) {
//         console.error('Error sending CSV file:', err);
//         res.status(500).json({ error: 'An error occurred while sending the CSV file.' });
//       }

//       // Delete the generated CSV file after it's sent
//       fs.unlink('exported_stocks.csv', (unlinkErr) => {
//         if (unlinkErr) {
//           console.error('Error deleting CSV file:', unlinkErr);
//         }
//       });
//     });
//   } catch (error) {
//     console.error('Error exporting and clearing stocks:', error);
//     res.status(500).json({ error: 'An error occurred while exporting and clearing stocks.' });
//   }
// });

router.get('/exportAndClearStocks', async (req, res) => {
  try {
    // Retrieve all data from the Stock collection
    const allStocks = await Stock.find();

    // Create a new Excel Workbook
    const wb = new excel4node.Workbook();
    const ws = wb.addWorksheet('Stocks');

    // Add headers to the worksheet
    const headerStyle = wb.createStyle({
      font: {
        bold: true,
      },
    });
    ws.cell(1, 1).string('SKU').style(headerStyle);
    ws.cell(1, 2).string('Stock ID').style(headerStyle);

    // Add data to the worksheet
    allStocks.forEach((stock, index) => {
      ws.cell(index + 2, 1).string(stock.sku);
      ws.cell(index + 2, 2).string(stock.stock_id);
    });

    // Create a temporary file path to save the Excel file
    const tempFilePath = './output_sample2.xlsx';

    // Write the workbook to a temporary file
    wb.write(tempFilePath);

    // Read the file content
    const fileContent = fs.readFileSync(tempFilePath);

    // Save the file to the database using the GeneratedExcel model
    await GeneratedExcel.create({
      filename: 'sample2.xlsx',
      content: fileContent,
    });

    // Set response headers for sending the XLSX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=exported_stocks.xlsx');

    // Send the file content as the response
    res.send("Generated Succesfully");

    // // Clear the Stock collection
    // await Stock.deleteMany();

    // // Delete the temporary file
    // fs.unlinkSync(tempFilePath);
  } catch (error) {
    console.error('Error exporting and clearing stocks:', error);
    res.status(500).json({ error: 'An error occurred while exporting and clearing stocks.' });
  }
});

router.get('/getFirstGeneratedExcel', async (req, res) => {
  try {
    // Retrieve the first generated Excel file from the database
    const firstGeneratedExcel = await GeneratedExcel.findOne().sort({ _id: 1 }).limit(1);

    if (!firstGeneratedExcel) {
      return res.status(404).json({ message: 'No generated Excel files found.' });
    }

    // Set response headers for sending the XLSX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${firstGeneratedExcel.filename}`);

    // Send the file content as the response
    res.send("downloading");
  } catch (error) { 
    console.error('Error fetching the first generated Excel:', error);
    res.status(500).json({ error: 'An error occurred while fetching the first generated Excel.' });
  }
});

module.exports = router;
