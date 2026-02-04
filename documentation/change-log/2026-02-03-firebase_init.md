=== Project Setup

First, let's associate this project directory with a Firebase project.
You can create multiple project aliases by running firebase use --add, 

i  Using project self-statistics-system-v1 (self-statistics-system-v1) .

=== Firestore Setup
i  firestore: ensuring required API firestore.googleapis.com is enabled...
✔ Please select the location of your Firestore database: us-central1

Firestore Security Rules allow you to define how and when to allow
requests. You can keep these rules in your project directory
and publish them with firebase deploy.

✔ What file should be used for Firestore Rules? firestore.rules
i  firestore.rules is unchanged

Firestore indexes allow you to perform complex queries while
maintaining performance that scales with the size of the result
set. You can keep index definitions in your project directory
and publish them with firebase deploy.

✔ What file should be used for Firestore indexes? firestore.indexes.json
i  firestore.indexes.json is unchanged

=== App Hosting Setup
i  This command links your local project to Firebase App Hosting. You will be able to deploy your web app with `firebase deploy` after setup.
✔ Please select an option Create a new backend
i  === Set up your backend
✔ Select a primary region to host your backend:
 us-central1
+  Location set to us-central1.

✔ Provide a name for your backend [1-30 characters] self-statistics-sys-v1-b
+  Name set to self-statistics-sys-v1-b

+  Created a new Firebase web app named "self-statistics-sys-v1-b"
✔ Successfully created backend!
        projects/self-statistics-system-v1/locations/us-central1/backends/self-statistics-sys-v1-b

i  === Deploy local source setup
✔ Specify your app's root directory relative to your firebase.json directory /src
+  Wrote configuration info to firebase.json
i  Writing default settings to apphosting.yaml...
+  Wrote C:\Users\Richard Li\MainFolder\1_PersonalProjects\2026\Self_Statistics_System_foundation\journal-&-graph-ai-demo_V0.5_autoGeneratingConceptNodes\src\apphosting.yaml
+  Firebase initialization complete!

+  Wrote configuration info to firebase.json
+  Wrote project information to .firebaserc

+  Firebase initialization complete!