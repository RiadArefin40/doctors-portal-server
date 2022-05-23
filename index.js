const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const app = express();
const port =process.env.PORT|| 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.flvuo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function  run(){
    try{
        async function  run(){
            try{
                await client.connect();
                const serviceCollection = client.db('Doctors-portal').collection('services');
                const bookingCollection = client.db('Doctors-portal').collection('booking');
                const userCollection = client.db('Doctors-portal').collection('users');

                 /**
                  * 
                  * API naming Convention
                  * 
                  * app.get('/booking')// get all booking by query or filter
                  * 
                  * app.get('/booking:id') // get a specific booking
                  * 
                  * app.post('booking') // add a new booking
                  * 
                  * app.patch('/booking/:id') update one
                  * 
                  * app.delete('/booking/:id')
                  * 
                  * app.put('/booking/:id') update or insert
                  * ** */

                app.get('/booking',async(req,res)=>{
                    const patient = req.query.patient;
                   
                    const query = {patient: patient};
                    const bookings = await bookingCollection.find(query).toArray()
                    res.send(bookings)
                })
                app.get('/service', async(req,res) =>{
                    const query = {};
                    const cursor = serviceCollection.find(query);
                    const services = await cursor.toArray();
                    res.send(services)
                })
                // ******************** update or insert  user email in user collection*****************************************************
                app.put('/user/:email',async (req,res)=>{
                    const email = req.params.email;
                    const user = req.body;
                    const filter = {email: email};
                    const options = { upsert:true};
                    const updateDoc={
                        $set: user,
                            
                    }
                    const result = await userCollection.updateOne(filter,updateDoc,options);
                    const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'2h'}) 
                    res.send({result , accesToken:token})

                })

    // ******************** update or insert  user email in admin collection*****************************************************
    app.put('/user/admin/:email', async (req,res)=>{
        const email = req.params.email;
        const requesterAccount = await userCollection.find({email:email}).toArray();
        console.log(requesterAccount)
        const filter = {email: email};
        const updateDoc={
            $set: {role:'admin'},
        }
        const result = await userCollection.updateOne(filter,updateDoc);
        res.send(result)
       if(requesterAccount.role === "admin"){
           console.log('admin')
         }
        // else{
        //     res.send({message:'unAuthorized user'})
        // }

    })

//***************************Check admin or not*************************************************************** */

               app.get('/admin/:email', async(req,res)=>{
               const email = req.params.email;
               const user = await userCollection.findOne({email:email});
               const isAdmin = user.role === 'admin'
               res.send({admin:isAdmin})
              })
//****************************************************************************************** */
                app.get('/user' , async(req,res)=>{
                    const users = await userCollection.find().toArray();
                    res.send(users)
                })

                app.get('/available', async(req,res) =>{
                    const date=req.query.date 
                    console.log(date)
                    const services= await serviceCollection.find().toArray();
                    const query = {date: date};
                    const bookings = await bookingCollection.find(query).toArray()


                    services.forEach(service => {
                        const serviceBookings = bookings.filter(b => b.treatment === service.name);
                        const booked = serviceBookings.map(s=> s.slot);
                       
                        const available = service.slots.filter(s=>!booked.includes(s))
                        service.slots = available;
                    })


                    res.send(services)

                })
               
                app.post('/booking', async(req,res)=>{
                    const booking = req.body;
                    const query = {treatment:booking.treatment ,date:booking.date,patient:booking.patient}
                    const exist = await bookingCollection.findOne(query);
                    if(exist){
                        return res.send({success:false, booking:exist})
                    }
                    const result =await bookingCollection.insertOne(booking);
                    res.send({success:true,result});
                })
            }
            finally{
        
            }
        
        }
        run().catch(console.dir);
       
    }
    finally{

    }

}
run().catch(console.dir);

console.log(uri)
app.use(cors());
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello from doctor uncle!')
})

app.listen(port, () => {
  console.log(`Doctors app ${port}`)
})