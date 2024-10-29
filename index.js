const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const mongodbRun = async () => {
  try {
    await client.connect();
    const database = client.db("touristSport");
    const usersCollection = database.collection("users");
    const usersDataCollection = database.collection("usersData");
    const countryDataCollection = database.collection("countryName");

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
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
      const result = tempResult[0].Country.sort();
      res.send(result);
    });

    app.get("/country/random/:max", async (req, res) => {
      const { max } = req.params;
      const countryRawData = countryDataCollection.find({});
      const countryData = await countryRawData.toArray();
      const totalCountry = countryData[0].Country;
      const chosenCountry =
        totalCountry[Math.floor(Math.random() * (totalCountry.length - 0)) + 0];
      console.log(chosenCountry);

      const query = { country_Name: chosenCountry };
      const cursor = usersDataCollection.find(query);
      const tempResult = await cursor.toArray();
      const result = tempResult.slice(0, max);
      res.send({ chosenCountry, result });
    });

    app.get("/spot/:sliceStart/:sliceEnd", async (req, res) => {
      const { sliceStart, sliceEnd } = req.params;
      const query = {};
      const cursor = usersDataCollection.find(query);
      const fullResult = await cursor.toArray();
      const result = fullResult.slice(sliceStart, sliceEnd);
      res.send(result);
    });

    app.get("/spot/data/:key/:value", async (req, res) => {
      const { key, value } = req.params;
      const query = { [key]: value };
      const cursor = usersDataCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
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
