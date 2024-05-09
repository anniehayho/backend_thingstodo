const firebase_db = require('./firebaseConfig');
const { collection, addDoc } = require("firebase/firestore");

const fs = require('fs');

const importTaskData = async () => {
  // Đọc dữ liệu từ file JSON
  const rawData = fs.readFileSync('taskData.json');
  const tasks = JSON.parse(rawData);

  // Thêm dữ liệu vào Firestore
  tasks.forEach(async (task) => {
    try {
      const docRef = await addDoc(collection(firebase_db, 'tasks'), task);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  });
};

module.exports = importTaskData;

