const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model')
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const textPattern = new RegExp(/(([A-z]|[0-9]|\s)*)/, 'g');
    const emailPattern = new RegExp(/((([A-z]|[0-9]|\s)*)@(([A-z]|[0-9]|\s)*))/, 'g');

    const titleMatched = title.match(textPattern).join('');
    const authorMatched = author.match(textPattern).join('');
    const emailMatched = email.match(emailPattern).join('');

    if (titleMatched.length < title.length || authorMatched.length < author.length || emailMatched.length < email.length) {
      throw new Error('Invalid characters !!!');
    }

    if (title && author && email && file && title.length <= 25 && author.length <= 50) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png' || fileExt === 'gif') {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
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
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });

    const userIp = req.clientIp;
    const userFound = await Voter.findOne({ user: userIp })

    if (userFound) {

      if (userFound.votes.includes(photoToUpdate._id)) {
        res.status(500).json({ message: 'You cant vote on the same picture twice !' });
      } else {
        userFound.votes.push(photoToUpdate._id);
        await userFound.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }

    } else {
      const newVoter = new Voter({ user: userIp, votes: [photoToUpdate._id] })
      await newVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }

};