const router = require("express").Router();

const {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
} = require("../controllers/testController");

router.get("/", getAllPersons);
router.get("/:id", getPersonById);
router.post("/", createPerson);
router.put("/:id", updatePerson);
router.delete("/:id", deletePerson);

module.exports = router;