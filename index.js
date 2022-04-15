const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
// const stripe = require('stripe')(process.env.STRIPE_SECRET);
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bvhfe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const database = client.db('shaving-foam');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');

        //.................product...............................
        // insert one product...............
        app.post('/products', async (req, res) => {
            const imageBuffer = Buffer.from(req.files.img.data.toString('base64'), 'base64');
            const product = {
                ...req.body, img: imageBuffer
            }
            const result = await productsCollection.insertOne(product);
            res.json(result);
        });
        //get all products..............
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        });
        //get one product...............
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        });
        //update product.................
        app.put('/products/update/:id', async (req, res) => {
            const id = req.params.id;
            const updatePackage = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    img: updatePackage.img,
                    name: updatePackage.name,
                    description: updatePackage.description,
                    price: updatePackage.price,
                    duration: updatePackage.duration,
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        //delete one Product..............
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        });

        //.................Order....................................
        //insert one order  (placeOrder)
        app.post('/placeOrder', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });
        //get All Orders...............
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        });
        //get one orders...............
        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.findOne(query);
            res.json(result);
        });
        //update one orders...............
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const query = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    payment: payment
                }
            }
            const result = await ordersCollection.updateOne(query, updateDoc);
            res.json(result);
        });
        //get All Orders of an user...............
        app.get('/myOrders/:email', async (req, res) => {
            const user = req.params;
            const query = { email: user.email };
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray();

            res.json(result);
        });
        //delete one order..............
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });


        //..............................review...............................
        // insert one review.............
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });
        //get All Reviews...............
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        });



        //........................user......................................
        //user insert for email..............
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });
        //user insert (upsert) for google............
        app.put('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.json(result);
        });
        //user make admin..................
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(query, updateDoc);
            res.json(result);
        });
        //check admin retrun bool value
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors portal!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})