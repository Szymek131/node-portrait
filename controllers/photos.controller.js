const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model')
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/
const acceptedExtensions = ['jpg', 'jpeg', 'png', 'gif']

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const emailPattern = /^[a-zA-Z0-9.\-_]*@[a-zA-Z0-9.\-_]*\.[a-z]{2,4}$/;
    const titlePattern = /[a-zA-Z0-9.\-_\s]{0,25}/;
    const authorPattern = /[a-zA-Z0-9.\-_\s]{0,50}/;

    if (
      !titlePattern.test(title)
      || !authorPattern.test(author)
      || !emailPattern.test(email)
    ) {
      return res.status(400).json({ message: 'Incorrect data' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Please pass file' });
    }

    const fileExtension = file.name.split('.').slice(-1)[0];
    if (!acceptedExtensions.includes(fileExtension)) {
      return res.status(400).json({ message: 'Invalid file type' });
    }

    const newPhoto = new Photo({ title, author, email, src: file.name, votes: 0 });
    await newPhoto.save(); // ...save new photo in DB
    res.status(201).json(newPhoto);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    const userIp = req.clientIp;
    const user = await Voter.findOne({ user: userIp }) || new Voter({ user: userIp, votes: [] })

    if (user.votes.includes(photoToUpdate._id)) {
      res.status(400).json({ message: 'You cant vote on the same picture twice !' });
      return;
    }

    user.votes.push(photoToUpdate._id);
    await user.save();
    photoToUpdate.votes++;
    await photoToUpdate.save();
    res.status(201).send({ message: 'OK' });

  } catch (err) {
    res.status(500).json(err);
  }
};
