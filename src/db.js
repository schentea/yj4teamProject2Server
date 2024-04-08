import mongoose from "mongoose";

mongoose.connect(`${process.env.DB_URL}/yj4project2`);

const db = mongoose.connection;

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected on DB"));
