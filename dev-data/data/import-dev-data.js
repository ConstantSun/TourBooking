const fs = require('fs');
// connect to DB:
const dotenv = require('dotenv');
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successfully established !');
  });

// Read from file
// fs.readFile(`${__dirname}/tours-simple.json`, async (err, data) => {
//   if (err) {
//     console.log(err);
//   }
//   const docs = JSON.parse(data);
//   console.log(typeof docs);
//   console.log(docs);
//   // Upload to MongoDB
//   try {
//     const res = await Tour.insertMany(docs);
//     console.log(res);
//   } catch (e) {
//     console.log(e);
//   }
// });
const data = fs.readFileSync(`${__dirname}/tours1.json`);
const docs = JSON.parse(data);
console.log(docs);

const importData = async () => {
  try {
    const res = await Tour.insertMany(docs);
    console.log(res);
    process.exit();
  } catch (e) {
    console.log(e);
  }
};
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data is deleted');
    process.exit();
  } catch (e) {
    console.log(e);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
