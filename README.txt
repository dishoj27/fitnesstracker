FITTRACK - SETUP

A) Put it online so it opens on any laptop
   1. Go to https://app.netlify.com/drop
   2. Drag this whole folder onto the page.
   3. Open the link it gives you + /login.html

B) Make ONE account work on every laptop (Firebase, free)
   1. https://console.firebase.google.com -> Add project
   2. Build -> Authentication -> Get started -> enable "Email/Password"
   3. Build -> Firestore Database -> Create database
      Then open the Rules tab and paste:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{uid} {
              allow read, write: if request.auth != null && request.auth.uid == uid;
            }
          }
        }

   4. Project settings (gear icon) -> Your apps -> Web (</>) -> register app
      Copy the firebaseConfig values into firebase-config.js
   5. Authentication -> Settings -> Authorized domains -> add your Netlify domain
   6. Re-upload the folder to Netlify.

Until step B is done the site runs in local mode: it works, but each
browser has its own separate accounts.

Note: workouts, goals and history are still saved per browser/device.
