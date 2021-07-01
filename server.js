require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const userSchema = new Schema({
  username: String,
  excercises: [{
    description: String,
    duration: String,
    date: Date
  }]
});

const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let { description, duration, date } = req.body;
  const _id = req.params._id;
  date = date ? new Date(date) : new Date();
  const excercise = { description, duration, date };
  User.findById(_id, (err, user) => {
    if(err) return res.status(500).send({ error: err.message });
    user.excercises.push(excercise)
    const { username } = user
    user.save((err, data) => {
      if(err) return res.status(500).send({ error: err.message });
      date = date.toDateString()
      return res.json({ _id, username, date, duration, description })
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  let { from, to, limit } = req.query
  from = from ? new Date(from) : new Date('1900-01-01')
  to = to ? new Date(to) : new Date()
  User.findById(_id,(err, user) => {
    if(err) return res.status(500).send({ error: err.message });
    const filteredData = user.excercises
                        .filter(t => t.date.getTime() >= from.getTime() && t.date.getTime() <= to.getTime())
                        .slice(0,limit ? limit : user.excercises.length)
                        .map( t => ({ description: t.description, date : t.date, duration: t.duration }))
    return res.json({
      username: user.username, 
      '_id' : user._id, 
      count: filteredData.length, 
      log: filteredData
    });
  });
});

app.post('/api/users', (req, res) => {
  const { username } = req.body
  const user = new User({
    username: username,
    excercises: []
  });
  User.findOne({username: username}, (err, data) => {
    if(err) return res.status(500).send({ error: err.message });
    if(data) {
      return res.json({ username: data.username, _id: data._id })
    } else {
      user.save((err, data) => {
        if(err) return res.status(500).send({ error: err.message });
        return res.json({ username: user.username, _id: user._id });
      })
    }
  })
})
.get('/api/users', (req, res) => {
  User
    .find()
    .select({excercises: 0})
    .exec((err, users) => {
      if(err) return res.status(500).send({ error: err.message });
      return res.json(users);
    });

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
