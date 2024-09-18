const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const stationSchema1=new Schema({
  stationId:{
    type:String,
    required:true
  },
  lat:{
    type:String,
    required:true
  },
  long:{
    type:String,
    required:true
  },
})

const stationSchema=mongoose.model('station',stationSchema1);
module.exports = stationSchema;