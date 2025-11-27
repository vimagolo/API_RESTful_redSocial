const {Schema ,model}=  require('mongoose');
const mongoosePaginate= require("mongoose-paginate-v2");

const PublicationSchema = Schema({
    text:{
        type: String,
        required : true
    },
    file:{
        type: String,
    },
    created_at:{
        type:Date,
        default: Date.now
    },
    user:{
        type:Schema.ObjectId,
        ref:"User"
    }
})

PublicationSchema.plugin(mongoosePaginate);

module.exports = model("Publication", PublicationSchema, "publications")