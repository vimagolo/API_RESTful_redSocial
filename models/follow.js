const {Schema , model}= require("mongoose");
const mongoosePaginate= require("mongoose-paginate-v2");

const FollowSchema = Schema({
    user:{
        type:Schema.ObjectId,
        ref:"User"
    },
    followed:{
        type:Schema.ObjectId,
        ref:"User"
    },
    create_at:{
        type:DataTransfer,
        default:Data.now
    }
});
//Aquí conectas el plugin al schema
FollowSchema.plugin(mongoosePaginate);

module.exports = model("Follow" ,FollowSchema, "follows");

