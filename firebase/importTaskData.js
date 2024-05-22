const firebase_db = require('./firebaseConfig');
const { collection, addDoc } = require("firebase/firestore");
const { Timestamp } = require("firebase/firestore"); // Import Timestamp class

const fs = require('fs');

const importTaskData = async () => {
  // Đọc dữ liệu từ file JSON
  const rawData = fs.readFileSync('taskData.json');
  const tasks = JSON.parse(rawData);

  // Thêm dữ liệu vào Firestore with date and time conversion
  tasks.forEach(async (task) => {
    try {
      // Combine date and time into a single string
      const dateTimeString = `${task.date} ${task.time}`;

      // Parse the string into a JavaScript Date object
      const dateObject = new Date(dateTimeString);

      // Create a Firestore Timestamp object from the Date object
      const timestamp = Timestamp.fromDate(dateObject);

      // Update task object with the timestamp (optional)
      task.dateTime = timestamp;

      // Add document with converted timestamp (or original task object)
      const docRef = await addDoc(collection(firebase_db, 'tasks'), task);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  });
};

module.exports = importTaskData;
