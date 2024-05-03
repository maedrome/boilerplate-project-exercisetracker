const express = require('express')
const app = express()
const cors = require('cors');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
  username: String,
  _id: String,
  count: Number,
  log: []
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res)=>{
  newUser = new User({
    username: req.body.username,
    _id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    count: 0,
    log: []
  });
  newUser.save();
  res.json({username: newUser.username, _id: newUser._id});
})

async function getUser(id){
  let user = await User.findById(id);
  return user;
}

app.post('/api/users/:_id/exercises', (req, res)=>{
  getUser(req.params._id).then((user)=>{
    user.count += 1;
    user.log.push({
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date===''? new Date().toDateString() : new Date(req.body.date).toDateString()
    });
    user.save();
    res.json({_id: user._id, username: user.username, date: req.body.date===''? new Date().toDateString() : new Date(req.body.date).toDateString(), duration: parseInt(req.body.duration), description: req.body.description})
  });
})

app.get('/api/users', (req, res)=>{
  User.find({}).then((users)=>{
    res.json(users.map((user) => {return {_id:user.id, username: user.username, __v:user.__v}}));
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  getUser(userId).then((user)=>{
    let log = user.log;
    partialResponse = {_id: user._id, username: user.username, count: user.count};
    if(from){
      log = log.filter((exercise)=>{
        return new Date(exercise.date) >= new Date(from);
      });
      partialResponse.from=from;

    }
    if(to){
      log = log.filter((exercise)=>{
        return new Date(exercise.date) <= new Date(to);
      });
      partialResponse.to=to;
    }
    if(limit){
      log = log.slice(0, limit);
    }
    user.count=log.length;
    partialResponse.log = log;
    res.json(JSON.parse(JSON.stringify(partialResponse)));
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
