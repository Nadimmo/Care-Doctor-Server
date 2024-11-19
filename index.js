const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const port = process.env.PROT || 5000;

// middleware
app.use(express.json())
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5000", "https://car-doctors-e85e1.web.app"],
  credentials: true
}))
app.use(cookieParser())


// create a middleware
const logged = async(req,res,next)=>{
  console.log('middleware', req.host, req.originalUrl)
  next()
}

// verify token
const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('tok tok token', token)
  if(!token){
   return res.status(401).send({message: "UnAuthorize"})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode)=>{
    console.log(err)
    if(err){
     return res.status(402).send({message: "UnAuthorize"})
    }
    req.user = decode;
    console.log('token in decode', decode)
    next()
  })
  
}


  const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const jsonwebtoken = require('jsonwebtoken')
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rrkijcq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
      const servicessCollection = client.db('CarDoctors').collection("services")
      const bookingCollection = client.db('CartDoctors').collection('bookings')

      // services related api
    app.get('/services', async(req,res)=>{
        const cursor = servicessCollection.find()
        const result = await cursor.toArray()
        res.send(result)

    })

    app.get('/services/:id', logged, async(req,res)=>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)}
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { _id: 0, title: 1, services_id: 1, price: 1, img: 1 },
          };
        const result = await servicessCollection.findOne(filter,options)
        res.send(result)
    })


    // auth related and create jwt api
    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'})

      res
      .cookie('token', token, {httpOnly: true, secure: true, sameSite: "none"})
      .send({success: true})
    })

    // delete token in cookies
    app.post('/logout', async(req,res)=>{
      const user = req.body;
      console.log('log out user', user)
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    })





    // bookings related api
    app.get('/bookings',logged, verifyToken, async(req,res)=>{
      console.log(req.query.email)
      if(req.user.email !== req.query.email){
       return res.status(403).send({message: "Forbidden"})
      }
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const booking = await bookingCollection.find(query).toArray()
      res.send(booking)
    })

    app.post('/bookings', async(req,res)=>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    app.delete('/bookings/:id', logged, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(filter)
      res.send(result)
    })

    app.patch('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateBooking = req.body;
      console.log(updateBooking)
      const updateDoc = {
        $set:{
          status: updateBooking.status
        }
      }

      const result = await bookingCollection.updateOne(filter,updateDoc)
      res.send(result)

    })
    //   // Send a ping to confirm a successful connection
    //   await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);
  


app.get('/', (req,res)=>{
    res.send('server is connecting..')
})

app.listen(port, ()=>{
    console.log(`server heating in database ${port}`)
})