const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const createErr = require("http-errors");
const session = require("express-session");
const dotenv = require('dotenv');

// Load environment variables from the appropriate .env file
console.log(process.env.NODE_ENV);
function loadEnvFile() {
  const envPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '.env')
    : path.resolve(__dirname, '.env.development');

  dotenv.config({ path: envPath });
}
loadEnvFile();

const { sequelize, db } = require("./src/config/dbConnection");
const errorHandler = require('./src/helpers/errorHandler');

const port = process.env.PORT || 3000;
const secretKey = process.env.SESSION_SECRET_KEY;
const src = path.join(__dirname, '/src')

const app = express();

// Express use functions
app.use(express.static('public'));
app.use('/img', express.static(path.join(src, `/public/images`)));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 3600000, // Session duration in milliseconds (1 hour in this example)
    },
  })
);

const loggersPath = path.join(src, `/loggers`)
if(!fs.existsSync(loggersPath)){
  fs.mkdirSync(loggersPath)
}
const accessLogStream = fs.createWriteStream(
  path.join(loggersPath, `/logs.log`),
  { flags: "a" }
);
app.use(
  morgan(
    ":method :url :status :res[content-length] --- :response-time ms :date[web]",
    { stream: accessLogStream }
  )
);
let isDatabaseAuthenticated = false;
app.use(async (req, res, next) => {
  if (!isDatabaseAuthenticated) {
    try {
      await sequelize.authenticate();
      console.log("Connection to the database has been established successfully.");
      isDatabaseAuthenticated = true; // Mark the database as authenticated
      db;
      next(); // Continue with the API request handling
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      next(errorHandler(500, 'Database connection error'));
    }
  } else {
    next(); // Continue with the API request handling if the database is already authenticated
  }
});

// Routes for admin
const adminRoutes = require("./src/routes/admin.routes");
app.use("/v1/admin", adminRoutes);

// Routes for user
const user = require("./src/routes/user.routes");
app.use("/v1/user", user);

// Routes for sedding
const seeding = require("./src/routes/seeding.routes");
app.use("/v1/seeding", seeding);

// Testing route
app.use("/", (req, res, next) => {
  if (isDatabaseAuthenticated === true) {
    console.log("Testing routes with simple /");
    next(createErr.NotFound());
  }else{
    next(createErr.NotFound());
  }
});

// Error Handler
app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    msg: err.message
  });
});

app.listen(port, () => {
  console.log("Server is runing on port", port);
});
