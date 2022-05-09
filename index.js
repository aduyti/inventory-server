const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5555;
app.use(cors());
app.use(express.json());

// AUTH verification
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    jwt.verify(authHeader.split(' ')[1], process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2bong.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('inventory-management').collection('products');
        const monthlyData = client.db('inventory-management').collection('monthlyStock');
        const supplierCollection = client.db('inventory-management').collection('supplier');

        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' });
            res.send({ token });
        })

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
            let id = req.params.id;
            id = id.length === 24 ? id : '000000000000000000000000';
            const query = { _id: ObjectId(id) };
            const product = await inventoryCollection.findOne(query);
            res.send(product);
        })
        // get products by email
        app.get('/inventory/email/:email', verifyJWT, async (req, res) => {
            if (req.decoded.email === req.params.email) {
                const query = { ownerEmail: (req.params.email) };
                const cursor = inventoryCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        })
        //create new product
        app.post('/inventory/new', async (req, res) => {
            const product = req.body;
            const result = await inventoryCollection.insertOne(product);
            res.send(result);
        })
        //update product quantity
        app.put('/inventory/id/:id', async (req, res) => {
            const { quantity } = req.body;
            const filter = { _id: ObjectId(req.params.id) };
            const updatedQuantity = {
                $set: {
                    quantity
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

// handle OPTIONS as default method
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if ('OPTIONS' == req.method) {
        return res.sendStatus(200);
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.send('find links');
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})