const { admin } = require('../util/admin');
const { validationResult } = require('express-validator');

exports.signup = async (req, res) => {
  try {
    const { email, password, handle } = req.body;

    // Create user with admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: handle
    });

    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId: userRecord.uid
    };

    await admin.firestore().doc(`/users/${handle}`).set(userCredentials);
    const token = await admin.auth().createCustomToken(userRecord.uid);
    
    return res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/email-already-in-use') {
      return res.status(400).json({ general: 'Email already in use' });
    }
    return res.status(500).json({ general: 'Something went wrong, please try again' });
  }
};

exports.signin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Sign in with admin SDK
    const userRecord = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(userRecord.uid);
    
    return res.json({ token });
  } catch (err) {
    console.error('Error:', err);
    return res.status(403).json({ general: 'Wrong credentials, please try again' });
  }
};

exports.getAuthenticatedUser = (req, res) => {
  let credentials = {}

  db
  .doc(`/users/${req.user.handle}`)
  .get()
  .then(doc => {
    if(doc.exists){
      credentials = doc.data()
      return res.json(credentials)
    }
    
  }).catch(err => {
    res.status(500).json({error: err.code})
  })
}

exports.uploadImage = (req, res) => {
  const Busboy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  let generatedToken = uuid();

  const busboy = new Busboy({ headers: req.headers });

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }
    file.on('data', data => {
      if (data.length > 125000) {
        return res
          .status(400)
          .json({ error: 'Image can not be larger than 1MB' });
      }
    });

    
    const imageExtension = filename.split('.')[
      filename.split('.').length - 1
    ];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;

    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    //filedan alinan veriyi okuyup filepathe yaziyoruz/// Temp klasoru
    file.pipe(fs.createWriteStream(filepath));
    
  });
  busboy.on("finish", () => {
    
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  

  busboy.end(req.rawBody);
};
