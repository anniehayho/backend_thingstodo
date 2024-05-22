const express = require('express');
const router = express.Router();
const firebase_db = require('../../firebase/firebaseConfig');
const { collection, getDocs,doc,updateDoc,deleteDoc, addDoc, setDoc, where, query, orderBy, groupBy, Timestamp } = require("firebase/firestore");
const importTaskData = require('../../firebase/importTaskData');

// Sử dụng hàm importTasks
// importTaskData();

//Hanle incoming GET requests to /tasks
router.get('/:userID', async (req, res, next) => {
  const userID = req.params.userID;
  const tasksList = async (firebase_db) => {
    const taskCol = collection(firebase_db, 'tasks');
    const taskSnapshot = await getDocs(taskCol);
    const taskList = taskSnapshot.docs.map(doc => doc.data());
    return taskList
  };
  const tasks = await tasksList(firebase_db);

  res.status(200).json({
    message: 'Hanlding GET requests to /tasks',
    tasks: tasks
  });
});

//Hanle incoming GET requests to /tasks/todayTask
router.get('/todayTask/:userID', async (req, res, next) => {
  const userID = req.params.userID;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(today);
  const startOfDay = Timestamp.fromDate(today);
  const endOfDay = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  const tasksList = async (firebase_db) => {
    const taskCol = collection(firebase_db, 'tasks');
    console.log(taskCol);
    const q = query(taskCol, where('userID', '==', userID), where('dateTime', '>=', startOfDay), where('dateTime', '<', endOfDay), orderBy('dateTime'));
    const taskSnapshot = await getDocs(q);
    const taskList = taskSnapshot.docs.map(doc => doc.data());
    return taskList
  };
  const tasks = await tasksList(firebase_db);

  res.status(200).json({
    message: 'Hanlding GET requests to /tasks/todayTask',
    tasks: tasks
  });
});

//Hanle incoming GET requests to /tasks/weeklyTask
router.get('/weeklyTask/:userID', async (req, res, next) => {
  const userID = req.params.userID;
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6:1)));
  const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
  
  const startOfWeekTimestamp = Timestamp.fromDate(new Date(startOfWeek.setHours(0, 0, 0, 0)));
  const endOfWeekTimestamp = Timestamp.fromDate(new Date(endOfWeek.setHours(23, 59, 59, 999)));
  
  const tasksList = async (firebase_db) => {
    const taskCol = collection(firebase_db, 'tasks');
    const q = query(taskCol, where('userID', '==', userID), where('dateTime', '>=', startOfWeekTimestamp), where('dateTime', '<=', endOfWeekTimestamp), orderBy('dateTime', "desc"));
    const taskSnapshot = await getDocs(q);
    const tasks = taskSnapshot.docs.map(doc => doc.data());

    const groupedTasks = tasks.reduce((grouped, task) => {
      const date = task.dateTime.toDate().toISOString().split('T')[0];
      const existingGroup = grouped.find(group => group.title === date);
      if (!existingGroup) {
        grouped.push({ title: date, data: [task] });
      } else {
        existingGroup.data.push(task);
      }
      return grouped;
    }, []);
    return groupedTasks
  };
  const tasks = await tasksList(firebase_db);

  res.status(200).json({
    message: 'Handling GET requests to /tasks/weekTask',
    tasks: tasks
  });
});

//Hanle incoming GET requests to /tasks/monthlyTask
router.get('/monthlyTask/:userID', async (req, res, next) => {
  const userID = req.params.userID;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const startOfMonthTimestamp = Timestamp.fromDate(new Date(startOfMonth.setHours(0, 0, 0, 0)));
  const endOfMonthTimestamp = Timestamp.fromDate(new Date(endOfMonth.setHours(23, 59, 59, 999)));
  
  const tasksList = async (firebase_db) => {
    const taskCol = collection(firebase_db, 'tasks');
    const q = query(taskCol, where('userID', '==', userID), where('dateTime', '>=', startOfMonthTimestamp), where('dateTime', '<=', endOfMonthTimestamp), orderBy('dateTime', 'desc'));
    const taskSnapshot = await getDocs(q);
    const tasks = taskSnapshot.docs.map(doc => doc.data());

    const groupedTasks = tasks.reduce((grouped, task) => {
      const date = task.dateTime.toDate().toISOString().split('T')[0];
      const existingGroup = grouped.find(group => group.title === date);
      if (!existingGroup) {
        grouped.push({ title: date, data: [task] });
      } else {
        existingGroup.data.push(task);
      }
      return grouped;
    }, []);
    return groupedTasks
  };
  const tasks = await tasksList(firebase_db);

  res.status(200).json({
    message: 'Handling GET requests to /tasks/monthlyTask',
    tasks: tasks
  });
});

//Hanle incoming Create requests to /tasks
router.post('/new', async (req, res, next) => {
  const task = req.body;
  const date = task.date.split('||')
  const day = date[0].split('-')[0]
  const month = date[0].split('-')[1] 
  const year = date[0].split('-')[2]
  const hour = date[1].split(':')[0]
  const minute = date[1].split(':')[1]
  const dateTime = new Date(year, Number(month)-1, Number(day), hour, minute)
  task['dateTime'] = dateTime
  task['date'] = date[0].trim()
  task['time'] = date[1].trim()
  console.log('task create', task)
  const docRef = await addDoc(collection(firebase_db, 'tasks'), task);
  console.log("Document written with ID: ", docRef.id);

  // Add the document ID to the document data
  const docData = { ...task, id: docRef.id };
  await setDoc(docRef, docData);

  res.status(200).json({
    message: 'Hanlding POST requests to /tasks',
  });
});

router.put('/updateTask/:id', async (req, res, next) => {
  const task= req.body;
  const id = req.params.id;
  const docRef = doc(collection(firebase_db, 'tasks'), id);
  console.log("Document written with ID: ", task);
  const datetime = task['dateTime'].seconds
  task['dateTime'] = Timestamp.fromMillis(datetime * 1000)
  // Add the document ID to the document data
  await updateDoc(docRef, task);
 
  res.status(200).json({
    message: 'Hanlding POST requests to /tasks',
  });
});

//Hanle incoming PATCH requests to /tasks/:taskId
router.patch('/:taskId', (req, res, next) => {
  res.status(200).json({
    message: 'Updated task!'
  });
});

//Hanle incoming DELETE requests to /tasks/:taskId
router.put('/deleteTask/:id', (req, res, next) => {
  const id = req.params.id;
  const docRef = doc(collection(firebase_db, 'tasks'), id);
  console.log("Document written with ID: ", id);

  // Add the document ID to the document data
  deleteDoc(docRef);
 
  res.status(200).json({
    message: 'Hanlding POST requests to /tasks',
  });
});

module.exports = router;