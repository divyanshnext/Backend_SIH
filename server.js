const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs').promises;
// Import Firebase credentials and MongoDB model
const serviceAccount = require('./sos-app-8ea89-firebase-adminsdk-bufbn-c596894790.json');
const Zone = require('./zone'); // Ensure path is correct
const URL = "mongodb+srv://hirez:admin@db.cxzjtyo.mongodb.net/?retryWrites=true&w=majority&appName=db";
const stationSchema = require('./stationSchema');
const getStationComplaintModel = require('./stationComplaint');
const adminSchema = require('./admin');
// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sos-app-8ea89.firebaseio.com"
});
const corsOptions = {
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  };
  
  
  const db = admin.firestore();
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());
  app.use(cors(corsOptions));

// MongoDB connection
const connect = async () => {
    try {
      await mongoose.connect(URL); // No need for useNewUrlParser and useUnifiedTopology options
      console.log('Connected to MongoDB successfully');
    } catch (err) {
      console.log(err);
    }
  };
  const connect2 = async () => {
    try {
      await mongoose.connect('mongodb+srv://techie_1:KO4ehGVm2V3IPRwy@sih.y3uy8.mongodb.net/?retryWrites=true&w=majority&appName=SIH');
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
    }
  };
// Function to fetch the user document from Firestore based on user ID

const getDocumentById = async (id) => {
  try {
    const snapshot = await db.collection('users').where('name', '==', id).get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return null;
    }
    const locations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const location = [data.location.latitude, data.location.longitude];
      locations.push(location);
    });
    return locations[0]; // Return the first location
  } catch (error) {
    console.error('Error getting document:', error);
  }
};

// Calculation of boundary coordinates based on range
const calcultion = (lat, long, range) => {
  const latChange = range / 111320.0;
  const longChange = latChange / Math.cos(lat * Math.PI / 180);
  const lat1 = lat - latChange;
  const lat2 = lat + latChange;
  const long1 = long - longChange;
  const long2 = long + longChange;
  return [lat1, lat2, long1, long2];
};

// Function to check hotspots within a specific range
const checkHotSpots = async (latitude, longitude, range) => {
  try {
    const boundaries = calcultion(latitude, longitude, range);
    const [lat1, lat2, long1, long2] = boundaries;

    // Query the MongoDB `Zone` collection to find hotspots
    const hotspots = await Zone.find({
      latitude: { $gte: lat1, $lte: lat2 },
      longitude: { $gte: long1, $lte: long2 }
    });
    return hotspots.length;
  } catch (err) {
    console.log(err);
    return 0;
  }
};
const checkStation = async (lat, long) => {
  const [lat1, lat2, long1, long2] = calculation(lat, long);
  try {
    const result = await stationSchema.find({
      lat: { $gte: lat1, $lte: lat2 },
      long: { $gte: long1, $lte: long2 }
    });
    // console.log(result.map(station => station.stationId));  // Logging station IDs
    return result;
  } catch (err) {
    console.error('Error finding stations:', err);
  }
};

const insertComplaint=async(lat,long)=>{
  try{
    const checks=await checkStation(lat,long);
    console.log(checks);
    const stationId=checks[0].stationId;
    console.log(stationId);
    const stationComplaintModel=getStationComplaintModel(stationId);
    const result=await stationComplaintModel.create({complaint:"harassment",status:"pending",date:Date.now()});
    return stationId;
  }catch(err){
    console.error('Error inserting complaint:', err);
  }
}
// Function to determine the zone based on the number of hotspots within different ranges
const allRangeCheck = async (latitude, longitude) => {
  try {
    let arr = [];
    await connect(); // Ensure MongoDB connection
    const ranges = [200, 600, 1200, 2000]; // Ranges for red, orange, yellow, and gold zones

    // Check for hotspots in each range
    for (const range of ranges) {
      const resu = await checkHotSpots(latitude, longitude, range);
      arr.push(resu);
    }

    // Determine zone based on hotspot proximity
    if (arr[0] !== 0) {
      return { zone: 'red', message: `You are in Red Zone: ${arr[0]} hotspot(s) present in 200m range` };
    } else if (arr[1] !== 0) {
      return { zone: 'orange', message: `You are in Orange Zone: ${arr[1]} hotspot(s) present in 600m range` };
    } else if (arr[2] !== 0) {
      return { zone: 'yellow', message: `You are in Yellow Zone: ${arr[2]} hotspot(s) present in 1200m range` };
    } else if (arr[3] !== 0) {
      return { zone: 'gold', message: `You are in Gold Zone: ${arr[3]} hotspot(s) present in 2000m range` };
    } else {
      return { zone: 'green', message: `You are in Green Zone. No hotspots present in 2km range` };
    }
  } catch (err) {
    console.log(err);
  }
};


app.get('/',(req,res)=>{
    res.status(200).json({message: "Hello World"})
})
// Endpoint to check safety zone
app.post('/check-safety-zone', async (req, res) => {
  const { latitude, longitude } = req.body; // Latitude and longitude from request body

  try {
    const zoneData = await allRangeCheck(latitude, longitude);
    console.log(zoneData)
    res.json(zoneData); // Responding with the zone data (zone and message)
  } catch (err) {
    console.error('Error checking safety zone:', err);
    res.status(500).send('Error determining safety zone.');
  }
});
app.get('/getAllDocs', async (req, res) => {
    try {
        // Reference to the collection
        const collectionRef = db.collection('users'); // Replace with your collection name

        // Get all documents
        const snapshot = await collectionRef.get();
        if (snapshot.empty) {
            return res.status(404).json({ message: 'No documents found' });
        }

        // Map documents to an array of data
        const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Send documents as JSON
        const result = {
          status:"success",
          data:docs
        }
        return res.send(docs);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

app.post("/registerComplaint",async(req,res)=>{
  try{
    const {lat,long}=req.body;
    const result=await insertComplaint(lat,long);
    res.status(200).json({message:`complaint inserted on station with id ${result}`});
  }catch(err){
    console.log(err.message);
    res.status(500).json({message: 'internal server error'})
  }
})

// Start the server and connect to MongoDB
app.listen(5001, () => console.log('Server running on port 5001'));

connect(); // Connect to MongoDB on server startup
module.exports=app;
