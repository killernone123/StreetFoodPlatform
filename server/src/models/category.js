const mongoose =require("mongoose");
const categorySchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required: true,
            unique: true,
            trim: true
        },

        slug:{
            type:String,
            required:true,
            unique:true,
            lowercase:true
        },
        image:{
            type:String,
            default:""
        },
        isActive:{
            type:Boolean,
            default:true
        },
        sortOder:{
            type:Number,
            default:0
        }
    },
    {
        timestamps:true
    }
)

const Category =mongoose.model("Category", categorySchema);

module.exports  = Category;