const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const populate = require('mongoose-autopopulate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.json());

app.use(session({
    secret: "Our little secret:)",
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    User.findById(req.user._id, function(err, user) {
      if (err) {
        return next(err);
      }
      req.user = user;
      req.isAdmin = user.isAdmin;
      next();
    });
  } else {
    req.isAdmin = false;
    next();
  }
});

mongoose.connect("mongodb://127.0.0.1:27017/alsDB", {useNewUrlParser: true});

const usersSchema = new mongoose.Schema ({
    name: String,
    lastname: String,
    email: String,
    phone: Number,
    username: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient', autopopulate: true }]
});

const patientsSchema = new mongoose.Schema({
  fname: String,
  lname: String,
  address: String,
  sex: String,
  age: String,
  ssn: String,
  phone: String,
  fv: Date
});

const surveysSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true},
  speech: {type: String, required: true},
  salivation: {type: String, required: true},
  swallowing: {type: String, required: true},
  handwriting: {type: String, required: true},
  cuttingFood: {type: String, required: true},
  dressingHygiene: {type: String, required: true},
  turningInBed: {type: String, required: true},
  walking: {type: String, required: true},
  climbingStairs: {type: String, required: true},
  dyspnea: {type: String, required: true},
  orthopnea: {type: String, required: true},
  respiratoryInsufficiency: { type: String, required: true },
  date: {type: Date, default: Date.now}
});


usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);


const User = mongoose.model("User", usersSchema);
const Patient = mongoose.model("Patient", patientsSchema);
const Survey = mongoose.model('Survey', surveysSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

app.get("/", function(req, res){
    res.render("landing");
});

app.get("/sign-up", function(req, res){
    res.render("sign-up")
})

app.get("/log-in", function(req, res){

  const errorMessage = req.session.errorMessage || null;
  req.session.errorMessage = null; // clear errorMessage from session
    res.render("log-in", { errorMessage });
})

app.get("/pass-reset", function(req, res){
    res.render("pass-reset")
})

app.get("/patients", function(req, res){
  // console.log('isAdmin:', req.isAdmin);
  if (req.isAdmin) {
    Patient.find({}, function(err, patients) {
      if (err) {
        console.log(err);
      } else {
        res.render('patients', { isAdmin: req.isAdmin , allPatients: patients });
      }
    });
  } else {
    if (req.isAuthenticated()) {
      User.findById(req.user._id).populate('patients').exec(function(err, user) {
        if (err) {
          console.log(err);
        } else {
          res.render("patients", { user: user });
        }
      });
    } else {
      res.redirect("/log-in");
    }
  }
  
});

app.get("/add-pat", function(req, res){
  if (req.isAuthenticated()) {
    res.render("add-pat")
  } else {
    res.redirect("/log-in");
  }
})

app.get("/next-pat", function(req, res){
  if (req.isAuthenticated()) {
    res.render("next-pat")
  } else {
    res.redirect("/log-in");
  }
})

app.get("/survey", function(req, res){
  if (req.isAuthenticated()) {
    User.findById(req.user._id).populate('patients').exec(function(err, user) {
      if (err) {
        console.log(err);
      } else {
        res.render("survey", { user: user });
      }
    });
  } else {
    res.redirect("/log-in");
  }
})

app.get("/diagrams", function(req, res){
  if (req.isAuthenticated()) {
    res.render("diagrams")
  } else {
    res.redirect("/log-in");
  }
})

app.get("/main", function(req, res){
  if (req.isAuthenticated()) {
    res.render("main", {title:"main", user:req.user.username})
  } else {
    res.redirect("/log-in");
  }
});

app.get("/settings", function(req, res){
  if (req.isAuthenticated()) {
    res.render("settings", {title:"settings", user: req.user.username , email:req.user.email , 
    name:req.user.name , lname:req.user.lastname});
  } else {
    res.redirect("/log-in");
  }
});

app.get("/delete", function(req, res){
      res.render("delete")
   });

app.get("/logout", function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });


  app.post("/sign-up", function(req, res){
    User.register({username: req.body.username, name: req.body.fname,
       lastname: req.body.lname, email: req.body.email, phone: req.body.number, 
       FV: req.body.firstv, Age: req.body.age, active: false}, 
        req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/sign-up")
      } else {
        passport.authenticate("local")(req, res, function(){
          res.render("success");
        });
      }
    });
  });

  
  app.post("/add-pat", function(req, res){

    const patient = new Patient ({
       fname:  req.body.fname,
       lname: req.body.lname,
       address: req.body.address,
       sex: req.body.gender,
       age: req.body.age,
       ssn: req.body.ssn,
       phone: req.body.phone,
       fv:req.body.firstv
    });
  
    patient.save(function(err, savedPatient){
      if (err){
          console.log(err);
      } else {
        User.findOneAndUpdate(
          { _id: req.user._id }, // Find the currently authenticated user by their ObjectId
          { $push: { patients: savedPatient } }, // Add the new patient's document to the user's patients array
          { new: true, autopopulate: true } // Retrieve the updated user document with the autopopulated patients array
        )
        .populate('patients')
        .exec(function(err, user) {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/add-pat");
            }
        });
      }
    });
  });

app.post("/patients/:id", function(req, res) {
  const patientId = req.params.id;
  User.findOneAndUpdate(
    { _id: req.user._id }, 
    { $pull: { patients: patientId } },
    { new: true }
  )
  .populate('patients') 
  .exec(function(err, user) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/patients');
    }
  });
});


app.get("/history/:id", async function(req, res) {
  try {
    const patient = await Patient.findById(req.params.id).exec();
    const surveys = await Survey.find({patient: patient._id}).exec();
    res.render('history', {
      patient: patient,
      surveys: surveys
    });
  } catch (err) {
    console.error(err);
  }
});
app.post("/settings", function(req, res){

const userId = req.user.id;

  User.findByIdAndRemove(userId, function(err){
    if (!err) {
      res.redirect("/delete");
    }
  });
});


app.post("/survey", function(req, res){
    const survey = new Survey ({
      patient: req.body.patientId,
      speech: req.body["speech"],
      salivation: req.body["salivation"],
      swallowing: req.body["swallowing"],
      handwriting: req.body["handwriting"],
      cuttingFood: req.body["cutting-food"],
      dressingHygiene: req.body["dressing-hygiene"],
      turningInBed: req.body["turning-in-bed"],
      walking: req.body["walking"],
      climbingStairs: req.body["climbing-stairs"],
      dyspnea: req.body["dyspnea"],
      orthopnea: req.body["orthopnea"],
      respiratoryInsufficiency: req.body["respiratory-insufficiency"],
    });

    survey.save(function(err, savedSurvey){
      if (err){
          console.log(err);
      } else {
        res.redirect("/survey");
      }
});
});
  app.post("/log-in", function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        // Pass the error message to the rendered HTML page
        return res.render('log-in', { title: "log-in" ,errorMessage:"Invalid username or password." });
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.redirect('/main');
      });
    })(req, res, next, function(err) {
      if (err) {
        return res.render('log-in', { title: "log-in" ,errorMessage:"Invalid username or password." });
      }
    });
  });
app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
  