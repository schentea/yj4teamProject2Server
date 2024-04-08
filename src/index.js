import "dotenv/config";
import cors from "cors";
import express from "express";
import userRouter from "./routers/userRotuer";

const PORT = process.env.PORT; //서버를 올릴때 제공해주는 주소를 받기 위해 변수로 지정
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  res.send("Hello World!!!!!");
});
app.use("/users", userRouter);

app.listen(PORT, () =>
  console.log(`Server is Listen on http://localhost:${PORT}`)
);
