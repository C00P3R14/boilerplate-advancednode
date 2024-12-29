'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();

const LocalStrategy = require('passport-local')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave:true,
  saveUninitialized:true,
  cookie: {secure: false}
}))

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views','./views/pug')

function ensureAuthenticated(req,res,next) {
  if(req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  

  passport.serializeUser((user, done) => {
    done(null,user._id)
  });
  
  passport.deserializeUser((id,done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      if(err) console.error(err)
      done(null, doc);
    });
  });

  passport.use(new LocalStrategy((username,password,done) => {
    myDataBase.findOne({username:username},(err, user) => {
      console.log(`User ${username} attempted to log in.`);
    if (err) return done(err);
    if (!user) return done(null, false);
    if (!bcrypt.compareSync(password, user.password)) return done(null, false);
    return done(null, user);
    })
  }))

  app.route('/').get((req, res) => {
    res.render('index',{
      title:'Hello',
      message:'Please log in.',
      showLogin:true,
      showRegistration:true
    })
  });

  app.route('/register').post((req,res,next) => {
    //step 1 Register new user
    const hash = bcrypt.hashSync(req.body.password, 12);

    myDataBase.findOne({username:req.body.username},(err, user) => {
      if(err) {next(err)}
     else if (user) {res.redirect('/')} else {
      myDataBase.insertOne(
        {username:req.body.username,password:hash}, (err,doc) => {
          if(err) {
            console.error(err)
            res.redirect('/')
          } else {
            // The inserted document is held within
            // the ops property of the doc
            next(null, doc.ops[0]);
          }
        }
      )
    }
    });

    //step 2 authenticate user
    passport.authenticate('local',{failureRedirect:'/'});

    //step 3 redirect
    res.redirect('/')

  })

  app.route('/profile').get(ensureAuthenticated,(req,res,next) => {
    res.render('profile',{username:req.user.username})
  })

  app.route('/login').post(passport.authenticate('local',{failureRedirect:'/'}),(req,res,next) => {
    res.redirect('/profile')
  })
  
  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
});

app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});



}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
