const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const personTestSchema = new Schema({
    name: {
        type: String,
        required: true,
    },

    surname: {
        type: String,
        required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
},
{ timestamps: true } // createdAt, updatedAt
);

// creo il modello `PersonTest` che si basa sullo schema scritto sopra.
const PersonTest = mongoose.model("PersonTest", personTestSchema);

// esporto il modello all'esterno
module.exports = PersonTest;
