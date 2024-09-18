const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const adminSchema1=new Schema({
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


const adminSchema=mongoose.model('admin',adminSchema1);
module.exports = adminSchema