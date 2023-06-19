const express = require('express');
const  app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // environment set up 
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());
// verify jwt 
const verifyJWT = (req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:"Unauthorization access"})
  }
  //barer tokan 
  const token = authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error:true,message:"Unauthorization access"});
    }
    req.decoded = decoded;
    next();
  })
}
console.log(process.env.DB_USER,process.env.DB_PASS);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jm9b2up.mongodb.net/?retryWrites=true&w=majority`;

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
    
   // await client.connect();
     
    const menuCollactions = client.db("dokanDB").collection("menu");
    const cartCollactions = client.db("dokanDB").collection("carts");
    const usersCollactions = client.db("dokanDB").collection("users");
    // for jwt 
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token});
    })
    // admin role
    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc = {
        $set:{
          role:"admin"
        },
      }
      const result = await usersCollactions.updateOne(filter,updatedDoc);
      res.send(result);
    })
    //user get
    app.get('/users',async(req,res)=>{
      const result = await usersCollactions.find().toArray();
      res.send(result);
    })
    //user related api
    app.post('/users',async(req,res)=>{
      const user = req.body;
      // already user exixts kinah cheack 
      const query = {email:user.email};
      const existingUser = await usersCollactions.findOne(query);
      console.log(existingUser);
      if (existingUser ) return res.send({message : "user already exists!"});
      const result = await usersCollactions.insertOne(user);
      res.send(result);
    })

    //pete chaile, menu realted apis for user
    app.get('/menu',async(req,res)=>{
        const result = await menuCollactions.find().toArray();
        res.send(result);
    })
    //cart for apis
    app.get('/carts',verifyJWT, async(req,res)=>{

      const email = req.query.email;
      //console.log(email);
      if ( !email ) 
        res.send([]);

      // for jwt
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error:true,message:"Forbiddin access"});
      }

      const query = {email: email};
      const result = await cartCollactions.find(query).toArray();
      res.send(result);
    })
    // cart collection 
    app.post('/carts',async(req,res)=>{
        const item = req.body;
       // console.log(item);
        const result = await cartCollactions.insertOne(item);
        res.send(result);
    })
    // delete
    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id :new ObjectId(id)};
      const result = await cartCollactions.deleteOne(query);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send("dokan is running on port 5000");
})

app.listen(port,()=>{
    console.log(`running on port ${port}`);
})  