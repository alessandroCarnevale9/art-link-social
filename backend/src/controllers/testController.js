const Person = require("../models/PersonTestModel");


const getAllPersons = async (req, res) => {
    try {
        const persons = await Person.find();
        res.status(200).json(persons);
    }
    catch (error) {
        console.error("Error in getAlPersons controller", error);
        res.status(500).json({message: "Internal server error"});
    }
};


const getPersonById = async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        
        if(!person)
            return res.status(404).json({message:`Person with ${req.params.id} not found`});

        res.status(200).json(person);
    }
    catch (error) {
        console.error("Error in getPersonById controller", error);
        res.status(500).json({message: "Internal server error"});
    }
};

const createPerson = async (req, res) => {
    try {
        const {name, surname, email} = req.body;
        const newPerson = new Person({name, surname, email});

        const savedPerson = await newPerson.save();
        // res.status(201).json({message: "Person created succesfully"});
        res.status(201).json(savedPerson);
    } catch (error) {
        console.error("Error in createPerson controller", error);
        res.status(500).json({message: "Internal server error"});
    }
};

const updatePerson = async (req, res) => {
    try {
        const {name, surname, email} = req.body;
        const updatedPerson = await Person.findByIdAndUpdate(req.params.id, {name, surname, email},
            {
                new: true,
            }
        );
        
        // updatedPerson not found...
        if(!updatedPerson)
            return res.status(404).json({message: `Person with ${req.params.id} not found`});

        res.status(200).json({message:"Person update succesfully"});
    } catch (error) {
        console.error("Error in updatePerson controller", error);
        res.status(500).json({message: "Internal server error"});
    }
}
const deletePerson = async (req, res) => {
    try {
        const deletedPerson = await Person.findByIdAndDelete(req.params.id);
        if(!deletedPerson)
            return res.status(404).json({message: `Person with ${req.params.id} not found`});

        res.status(200).json({message:"Person deleted succesfully"});
    } catch (error) {
        console.error("Error in deletedPerson controller", error);
        res.status(500).json({message: "Internal server error"});
    }
}

module.exports = {
  getAllPersons,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
};