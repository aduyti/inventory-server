const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5555;
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2bong.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('inventory-management').collection('products');
        const monthlyData = client.db('inventory-management').collection('monthlyStock');
        const supplierCollection = client.db('inventory-management').collection('supplier');
        // get monthly Stock data
        app.get('/data/monthly', async (req, res) => {
            const cursor = monthlyData.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        // get supplier Stock data
        app.get('/data/supplier', async (req, res) => {
            const cursor = supplierCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })
        // get all products
        app.get('/inventory/all', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });
        // get only 6 products
        app.get('/inventory/6', async (req, res) => {
            const query = {};
            const cursor = inventoryCollection.find(query).limit(6);
            const products = await cursor.toArray();
            res.send(products);
        });
        // get product by id
        app.get('/inventory/id/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const product = await inventoryCollection.findOne(query);
            res.send(product);
        })
        // get products by email
        app.get('/inventory/email/:email', async (req, res) => {
            const query = { ownerEmail: (req.params.email) };
            const cursor = inventoryCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        //create new product
        app.post('/inventory/new', async (req, res) => {
            const newProduct = req.body;
            const result = await inventoryCollection.insertOne(newProduct);
            res.send(result);
        })
        //update product quantity
        app.put('/inventory/id/:id', async (req, res) => {
            const newQuantity = req.body;
            const filter = { _id: ObjectId(req.params.id) };
            const updatedQuantity = {
                $set: {
                    quantity: newQuantity
                }
            };
            const options = { upsert: true };
            const result = await inventoryCollection.updateOne(filter, updatedQuantity, options);
        })
        // delete product
        app.delete('/inventory/id/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await inventoryCollection.deleteOne(query);
            res.send(result);
        })

    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('find links');
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})