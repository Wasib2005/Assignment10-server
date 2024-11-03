require("dotenv").config();
const express = require("express");

const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.gjjj5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const mongodbRun = async () => {
  try {
    await client.connect();
    const database = client.db("touristSport");
    const usersCollection = database.collection("users");
    const usersDataCollection = database.collection("usersData");
    const countryDataCollection = database.collection("countryName");

    app.get("/users/:userEmail", async (req, res) => {
      const { userEmail } = req.params;
      res.send(result);
    });

    app.post("/createUsers", async (req, res) => {
      const userData = req.body;
      const { userEmail } = userData;
      const checkUser = await usersCollection.findOne({ userEmail });
      if (checkUser) {
        res.send({ userStatus: "User Exists" });
      } else {
        const result = await usersCollection.insertOne(userData);
        res.send({ userStatus: "User Created" });
      }
    });

    app.patch("/updateUserProfile", async (req, res) => {
      const { updateData, userEmail } = req.body;

      const filter = { user_email: userEmail };
      const options = { upsert: true };
      const updateDoc = {
        $set: { user_name: updateData.userName },
      };
      const result1 = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const result2 = await usersDataCollection.updateMany(filter, updateDoc);
      res.send({
        result1: `${result1.matchedCount} document(s) matched the filter, updated ${result1.modifiedCount} document(s)`,
        result2: `Updated ${result2.modifiedCount} documents`,
      });
    });

    app.get("/spot", async (req, res) => {
      const query = {};
      const cursor = usersDataCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/spot/:sortBy/:sortValueUrl/:country", async (req, res) => {
      const { sortBy, sortValueUrl, country } = req.params;
      const sortValue = parseInt(sortValueUrl);
      if (sortValue === 1 || sortValue === -1) {
        let query = {};
        if (country === "all" || country === "All") {
        } else {
          query = { country_Name: country };
        }
        const options = {
          sort: { [sortBy]: sortValue },
        };
        const cursor = usersDataCollection.find(query, options);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.send("sort value is either 1 or -1");
      }
    });

    app.get("/random/:howManyUrl", async (req, res) => {
      const { howManyUrl } = req.params;
      if (Number(howManyUrl)) {
        const howMany = Number(howManyUrl);
        const totalDataInDatabase = await usersDataCollection.countDocuments(
          {}
        );
        if (howMany <= totalDataInDatabase) {
          const rawData = usersDataCollection.find({});
          const data = await rawData.toArray();
          const result = [];
          const randomNumberList = [];
          for (let index = 0; index < howMany; index++) {
            let randomNumber =
              Math.floor(Math.random() * (data.length - 0)) + 0;
            while (randomNumberList.includes(randomNumber)) {
              randomNumber = Math.floor(Math.random() * (data.length - 0)) + 0;
            }
            const element = data[randomNumber];
            result.push(element);
            randomNumberList.push(randomNumber);
          }
          res.send(result);
        } else {
          res.send(
            `The number should be less then or equal to ${totalDataInDatabase}`
          );
        }
      } else {
        res.send("Give me a number");
      }
    });

    app.get("/country", async (req, res) => {
      const countryData = countryDataCollection.find({});
      const tempResult = await countryData.toArray();
      const result = tempResult[0]?.Country?.sort();
      res.send(result);
    });

    app.get("/country/random/:max", async (req, res) => {
      const { max } = req.params;
      const countryRawData = countryDataCollection.find({});
      const countryData = await countryRawData.toArray();
      const totalCountry = countryData[0]?.Country;
      const chosenCountry =
        totalCountry[
          Math.floor(Math.random() * (totalCountry?.length - 0)) + 0
        ];
      const query = { country_Name: chosenCountry };
      const cursor = usersDataCollection.find(query);
      const tempResult = await cursor.toArray();
      const result = tempResult.slice(0, max);
      if (tempResult.length !== 0) {
        res.send({ chosenCountry, result });
      } else {
        res.send([]);
      }
    });

    app.get("/spot/:sliceStart/:sliceEnd", async (req, res) => {
      const { sliceStart, sliceEnd } = req.params;
      const query = {};
      const cursor = usersDataCollection.find(query);
      const fullResult = await cursor.toArray();
      const result = fullResult.slice(sliceStart, sliceEnd);
      res.send(result);
    });

    app.get("/spotData/:key/:value", async (req, res) => {
      const { key, value } = req.params;
      if (key === "_id") {
        const query = { [key]: new ObjectId(value) };
        const cursor = usersDataCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        const query = { [key]: value };
        const cursor = usersDataCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    app.post("/UploadSpotData", async (req, res) => {
      const userData = req.body;
      const { tourists_spot_name, user_email, country_Name } = userData;
      const query = { tourists_spot_name, user_email };
      const cursor = usersDataCollection.findOne(query);
      const dataFromDatabase = await cursor;

      const query2 = {};
      const cursor2 = countryDataCollection.findOne(query2);
      const countryDataFromDatabase = await cursor2;
      const allCountry = countryDataFromDatabase?.Country;
      let newAllCountry = [];

      if (dataFromDatabase) {
        res.send({ error: "Already Exists" });
      } else {
        const result = await usersDataCollection.insertOne(userData);
        res.send(result);
      }
      if (!allCountry?.includes(country_Name)) {
        newAllCountry = [...allCountry, country_Name];
        const filter = { _id: new ObjectId("67201674b67670a57a726318") };
        const options = { upsert: true };
        const updateCountry = {
          $set: {
            Country: newAllCountry,
          },
        };
        const result = await countryDataCollection.updateOne(
          filter,
          updateCountry,
          options
        );
      }
    });

    app.patch("/UpdateSpotData", async (req, res) => {
      const { id, tourists_spot_data } = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: { ...tourists_spot_data },
      };
      const result = await usersDataCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send({
        result: `${result.matchedCount} document matched the filter, updated ${result.modifiedCount} document`,
      });
    });

    app.post("/deleteSpotData/:id/:userEmail", async (req, rec) => {
      const { id, userEmail } = req.params;
      const query = { _id: new ObjectId(id), user_email: userEmail };
      const result = await usersDataCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        rec.send({ result: "Successfully" });
      } else {
        rec.send({
          result: "No documents",
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Database Connected");
  } finally {
  }
};
mongodbRun().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
