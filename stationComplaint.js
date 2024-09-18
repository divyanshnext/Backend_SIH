const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const stationComplaintSchema1=new Schema({
  complaint:{
    type:String,
    required:true
  },
  status:{
    type:String,
    required:true
  },
  date:{
    type:String,
    required:true
  }
})
const getStationComplaintModel = (id) => {
  const modelName = `Station_${id}`;
  console.log(id)
  return mongoose.model(modelName, stationComplaintSchema1);
};
module.exports = getStationComplaintModel
// Compare this snippet from SIH%20alert/schema/stationSchema.js: