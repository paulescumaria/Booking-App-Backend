require('dotenv').config();
const express = require('express');
const db = require('./db');
const bcrypt = require("bcrypt");
var cors = require('cors');

const app = express();
const port = 8080;

app.use(express.json())

app.use(cors({
  "origin": "http://localhost:3000",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
}));

app.get('/', async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users;");
    res.send(result.rows)
    res.status(200);
  } catch(err) {
    console.log(err);
    res.status(400);
  }
})

app.post("/register", async (req, res) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var accountType = req.body.accountType;
    var passwordUser = req.body.password;

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordUser, saltRounds);

      if (!firstName || !lastName || !email || !accountType || !passwordUser) {
        throw Error("Invalid parameters");
      } 

      try {
        const result = await db.query(`INSERT INTO users (firstName, lastName, email, accountType, passwordUser) VALUES (($1), ($2), ($3), ($4), ($5)) RETURNING id, firstname, lastname, email, accounttype`, [firstName, lastName, email, accountType, hashedPassword]);
        res.status(200).send(result.rows);
      } catch(err) {
        res.status(409).send({error: "Email already exist in database"});
      }
    } catch(err) {
      if (!firstName || !lastName || !email || !accountType || !passwordUser) {
        res.status(400).send(err);
      } else {
        res.status(500).send(err);
      }
    }
})

app.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = ($1)", [email]);
    let match; 

    if (!email || !password) {
      throw Error("Invalid parameters");
    }

    if (result.rows.length > 0) {
      match = await bcrypt.compare(password, result.rows[0].passworduser);
    }

    if (result.rows.length === 0) {
      res.status(400).send({error: "Email incorrect!"});
    } else if (!match) {
        res.status(400).send({error: "Password incorrect!"});
    } else {
      res.status(200).send(result.rows[0]);
    }
  } catch(err) {
    if (!email || !password) {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

// property - create, viewAll, view, edit, delete

app.get("/viewproperties/:ownerID", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM properties WHERE ownerid = ($1)`, [req.params.ownerID]);
    res.status(200).send(result.rows);
  } catch(err) {
    res.status(500).send(err);
  }
})

app.get("/viewproperty/:propertyID", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM properties WHERE id = ($1)`, [req.params.propertyID]);
    res.status(200).send(result.rows);
  } catch(err) {
    res.status(500).send(err);
  }
})

app.post("/createproperty/:ownerID", async (req, res) => {
  var name = req.body.name;
  var description = req.body.description;
  var type = req.body.type;
  var phone = req.body.phone;
  var address = req.body.address;
  var country = req.body.country;
  var city = req.body.city;
  var ownerID = req.params.ownerID;

  try {
    if (!name || !description || !type || !phone || !address || !country || !city || !ownerID) {
      throw Error("Invalid parameters");
    }

    try {
      await db.query(`INSERT INTO properties (name, description, type, phone, address, country, city, ownerID) VALUES (($1), ($2), ($3), ($4), ($5), ($6), ($7), ($8))`, [name, description, type, phone, address, country, city, ownerID]);
      res.redirect(`/viewproperties/${ownerID}`);
    } catch(err){
      res.status(409).send(err);
    }
  } catch(err) {
    if (!name || !description || !type || !phone || !address || !country || !city) {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.put("/editproperty/:propertyID", async (req, res) => {
  var name = req.body.name;
  var description = req.body.description;
  var type = req.body.type;
  var phone = req.body.phone;
  var address = req.body.address;
  var country = req.body.country;
  var city = req.body.city;
  var propertyID = req.params.propertyID; 

  try {
    if (!name || !description || !type || !phone || !address || !country || !city) {
      throw Error("Invalid parameters");
    }

    await db.query(`UPDATE properties SET name = ($1), description = ($2), type = ($3), phone = ($4), address = ($5), country = ($6), city = ($7) WHERE properties.id = ($8)`, [name, description, type, phone, address, country, city, propertyID])
    res.status(200).send("OK")
  } catch(err) {
    if (!name || !description || !type || !phone || !address || !country || !city) {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.delete("/removeproperty/:propertyID", async (req, res) => {
  var propertyID = req.params.propertyID; 

  try {
    await db.query(`DELETE FROM properties WHERE properties.id = ($1)`, [propertyID])
    res.status(200).send("OK");
  } catch(err) {
      res.status(500).send(err);
  }
})

// rooms - add, view, edit, delete

app.post("/addrooms/:propertyID", async (req, res) => {
  var name = req.body.name;
  var price = req.body.price;
  var details = req.body.details;
  var numberOfPersons = req.body.numberOfPersons;
  var type = req.body.type;
  var propertyID = req.params.propertyID;
  
  try {
    if (!name || !price || !details || !numberOfPersons || !type) {
      throw Error("Invalid parameters");
    } 

    try {
      await db.query(`INSERT INTO rooms (name, price, details, numberofpersons, type, propertyid) 
                      VALUES (($1), ($2), ($3), ($4), ($5), ($6))`, [name, price, details, numberOfPersons, type, propertyID])
      res.status(200).redirect(`/viewrooms/${propertyID}`);
    } catch(err) {
      res.status(502).send(err);
    }
  } catch(err) {
    if (!name || !price || !details || !numberOfPersons || !type) {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.get("/viewrooms/:propertyID", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM rooms WHERE propertyid = ($1)`, [req.params.propertyID])
    res.status(200).send(result.rows);
  } catch(err) {
    res.status(500).send(err);
  }
})

app.get("/viewroom/:roomID", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM rooms WHERE id = ($1)`, [req.params.roomID])
    res.status(200).send(result.rows)
  } catch(err) {
    res.status(500).send(err);
  }
})

app.put("/editroom/:roomID", async (req, res) => {
  var name = req.body.name;
  var price = req.body.price;
  var details = req.body.details;
  var numberOfPersons = req.body.numberOfPersons;
  var type = req.body.type;
  
  try {
    if (!name || !price || !details || !numberOfPersons || !type) {
      throw Error("Invalid parameters");
    } 

    try {
      await db.query(`UPDATE rooms SET name = ($1), price = ($2), details = ($3), numberofpersons = ($4), type = ($5) 
                      WHERE id = ($6)`, [name, price, details, numberOfPersons, type, req.params.roomID])
      res.status(200).send("OK");
    } catch(err) {
      res.status(502).send(err);
    }
  } catch(err) {
    if (!name || !price || !details || !numberOfPersons || !type) {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.delete("/removeroom/:roomID", async (req, res) => {
  try {
    await db.query(`DELETE FROM rooms 
                    WHERE id = ($2)`, [req.params.propertyID, req.params.roomID]);
    res.status(200).send("OK")
  } catch(err){
    res.status(500).send(err);
  }
})

// reservation - guest : add, view | owner: cancel, view

app.post("/addreservation/:roomID/:guestID", async (req, res) => {
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var roomID = req.params.roomID;
  var questID = req.params.guestID;

  try {
    if (!startDate || !endDate) {
      throw Error("Invalid parameters");
    } 

    try {
      const reservated = await db.query(`SELECT * FROM reservations
                                         WHERE roomid = ($1) 
                                         AND ((startdate >= ($2) AND startdate < ($3))
                                              OR 
                                              (enddate > ($2) AND enddate <= ($3)));`, [roomID, startDate, endDate]);  
      if (!reservated.rows.length) {
        await db.query(`INSERT INTO reservations (startDate, endDate, roomid, guestid) 
                        VALUES (($1), ($2), ($3), ($4))`, [startDate, endDate, roomID, questID])
        res.status(200);
      } else {
        res.send("The date is occupeid!")
      }                                                                 
    } catch(err) {
      res.status(502).send(err);
    }
  } catch(err) {
    if (!startDate || !endDate)  {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.delete("/cancelreservation/:reservationID/:propertyID", async (req, res) => {
  try {
    await db.query(`DELETE FROM reservations WHERE id = ($1)`, [req.params.reservationID]);
    res.status(200).redirect(`/viewreservations/${req.params.propertyID}`)
  } catch(err) {
    res.status(500).send(err);
  }
})

app.post("/viewreservations/:propertyID", async (req, res) => {
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;

  try {
    if (!startDate || !endDate) {
      throw Error("Invalid parameters");
    } 

    try {
      const result = await db.query(`SELECT * FROM rooms
      INNER JOIN reservations ON rooms.id = reservations.roomid
      WHERE rooms.propertyid = ($1) 
      AND ((startdate >= ($2) AND startdate < ($3))
           OR 
           (enddate > ($2) AND enddate <= ($3)));`, [req.params.propertyID, startDate, endDate]);
      res.status(200).send(result.rows);
    } catch(err) {
      res.status(400).send(err);
    }
  } catch(err) {
    if (!startDate || !endDate)  {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.get("/viewreservations/:guestID", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM rooms
                                  INNER JOIN reservations ON rooms.id = reservations.roomid
                                  WHERE reservations.guestid = ($1)`, [req.params.guestID]);
    res.status(200).send(result.rows)
  } catch(err) {
      res.status(500).send(err);
    }
})

//guest filter

app.post("/searchproperty", async (req, res) => {
  var country = req.body.country;
  var city = req.body.city;
  var startDate = req.body.startDate;
  var endDate = req.body.endDate;
  var numberOfPersons = req.body.numberOfPersons;

  try {
    if (!country || !city || !startDate || !endDate || !numberOfPersons) {
      throw Error("Invalid parameters");
    }  

    const result = await db.query(`SELECT * FROM rooms
                                  INNER JOIN properties ON properties.id = rooms.propertyid
                                  INNER JOIN reservations ON rooms.id = reservations.roomid
                                  WHERE rooms.numberofpersons = ($1) 
                                  AND properties.country = ($2) AND properties.city = ($3)
                                  AND NOT ((reservations.startdate >= ($4) AND reservations.startdate < ($5))
                                           OR 
                                           (reservations.enddate > ($4) AND reservations.enddate <= ($5)))`, [numberOfPersons, country, city, startDate, endDate]);
    res.status(200).send(result.rows);
  } catch(err) {
    if (!country || !city || !startDate || !endDate || !numberOfPersons)  {
      res.status(400).send(err);
    } else {
      res.status(500).send(err);
    }
  }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})