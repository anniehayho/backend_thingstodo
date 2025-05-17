const express = require('express');
const router = express.Router();
const { firebase_db } = require('../../firebase/firebaseConfig');
const {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  where,
  query,
  orderBy,
  Timestamp
} = require("firebase/firestore");
const authMiddleware = require('../middleware/auth');

// GET today's tasks
try {
  router.get('/today', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfDay = Timestamp.fromDate(today);
      const endOfDay = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('dateTime', '>=', startOfDay),
        where('dateTime', '<', endOfDay),
        orderBy('dateTime')
      );

      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => doc.data());

      res.status(200).json({
        success: true,
        message: 'Today\'s tasks retrieved successfully',
        tasks: taskList
      });
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve today\'s tasks',
        error: error.message
      });
    }
  });

  // GET all tasks
  router.get('/all', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(taskCol, where('userID', '==', userID), orderBy('dateTime', 'desc'));
      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => doc.data());

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        tasks: taskList
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        error: error.message
      });
    }
  });

  // GET weekly tasks
  router.get('/weekly', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)));
      const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));

      const startOfWeekTimestamp = Timestamp.fromDate(new Date(startOfWeek.setHours(0, 0, 0, 0)));
      const endOfWeekTimestamp = Timestamp.fromDate(new Date(endOfWeek.setHours(23, 59, 59, 999)));

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('dateTime', '>=', startOfWeekTimestamp),
        where('dateTime', '<=', endOfWeekTimestamp),
        orderBy('dateTime', 'desc')
      );

      const taskSnapshot = await getDocs(q);
      const tasks = taskSnapshot.docs.map(doc => doc.data());

      // Group tasks by date
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

      res.status(200).json({
        success: true,
        message: 'Weekly tasks retrieved successfully',
        tasks: groupedTasks
      });
    } catch (error) {
      console.error('Error fetching weekly tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weekly tasks',
        error: error.message
      });
    }
  });

  // GET monthly tasks
  router.get('/monthly', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startOfMonthTimestamp = Timestamp.fromDate(new Date(startOfMonth.setHours(0, 0, 0, 0)));
      const endOfMonthTimestamp = Timestamp.fromDate(new Date(endOfMonth.setHours(23, 59, 59, 999)));

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('dateTime', '>=', startOfMonthTimestamp),
        where('dateTime', '<=', endOfMonthTimestamp),
        orderBy('dateTime', 'desc')
      );

      const taskSnapshot = await getDocs(q);
      const tasks = taskSnapshot.docs.map(doc => doc.data());

      // Group tasks by date
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

      res.status(200).json({
        success: true,
        message: 'Monthly tasks retrieved successfully',
        tasks: groupedTasks
      });
    } catch (error) {
      console.error('Error fetching monthly tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve monthly tasks',
        error: error.message
      });
    }
  });

  // CREATE a new task
  router.post('/new', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const task = req.body;

      if (!task.date || !task.taskName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields (date, taskName)'
        });
      }

      // Add userID to task
      task.userID = userID;

      // Parse date and time
      const date = task.date.split('||');
      if (date.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'Date format should be "DD-MM-YYYY || HH:MM"'
        });
      }

      const day = date[0].split('-')[0];
      const month = date[0].split('-')[1];
      const year = date[0].split('-')[2];
      const hour = date[1].split(':')[0];
      const minute = date[1].split(':')[1];

      const dateTime = new Date(year, Number(month) - 1, Number(day), hour, minute);

      task.dateTime = dateTime;
      task.date = date[0].trim();
      task.time = date[1].trim();

      // Add task to Firestore
      const docRef = await addDoc(collection(firebase_db, 'tasks'), task);

      // Update document with its ID
      const docData = { ...task, id: docRef.id };
      await setDoc(docRef, docData);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        taskId: docRef.id
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: error.message
      });
    }
  });

  // UPDATE a task
  router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const taskId = req.params.id;
      const task = req.body;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      // Check if the task belongs to the user
      const docRef = doc(collection(firebase_db, 'tasks'), taskId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const taskData = docSnap.data();
      if (taskData.userID !== userID) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Task does not belong to this user'
        });
      }

      // Handle dateTime conversion
      if (task.dateTime && task.dateTime.seconds) {
        const datetime = task.dateTime.seconds;
        task.dateTime = Timestamp.fromMillis(datetime * 1000);
      }

      // Update task in Firestore
      await updateDoc(docRef, task);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        taskId: taskId
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        error: error.message
      });
    }
  });

  // DELETE a task
  router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const taskId = req.params.id;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      // Check if the task belongs to the user
      const docRef = doc(collection(firebase_db, 'tasks'), taskId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const taskData = docSnap.data();
      if (taskData.userID !== userID) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Task does not belong to this user'
        });
      }

      // Delete task from Firestore
      await deleteDoc(docRef);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        taskId: taskId
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
        error: error.message
      });
    }
  });

  // For backward compatibility (since your original code used PUT)
  router.put('/delete/:id', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const taskId = req.params.id;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      // Check if the task belongs to the user
      const docRef = doc(collection(firebase_db, 'tasks'), taskId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const taskData = docSnap.data();
      if (taskData.userID !== userID) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Task does not belong to this user'
        });
      }

      // Delete task from Firestore
      await deleteDoc(docRef);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        taskId: taskId
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task',
        error: error.message
      });
    }
  });

  // GET a specific task by ID
  router.get('/task/:id', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;
      const taskId = req.params.id;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      // Get task from Firestore
      const docRef = doc(collection(firebase_db, 'tasks'), taskId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const taskData = docSnap.data();

      // Check if the task belongs to the user
      if (taskData.userID !== userID) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Task does not belong to this user'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        task: taskData
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve task',
        error: error.message
      });
    }
  });

  // GET important tasks
  router.get('/important', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('starred', '==', true),
        orderBy('dateTime', 'desc')
      );

      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => doc.data());

      res.status(200).json({
        success: true,
        message: 'Important tasks retrieved successfully',
        tasks: taskList
      });
    } catch (error) {
      console.error('Error fetching important tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve important tasks',
        error: error.message
      });
    }
  });

  // GET done/completed tasks
  router.get('/done', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('status', '==', 'Done'),
        orderBy('dateTime', 'desc')
      );

      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => doc.data());

      res.status(200).json({
        success: true,
        message: 'Completed tasks retrieved successfully',
        tasks: taskList
      });
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve completed tasks',
        error: error.message
      });
    }
  });

  // GET tasks scheduled for later
  router.get('/later', authMiddleware, async (req, res) => {
    try {
      const userID = req.user.uid;

      const taskCol = collection(firebase_db, 'tasks');
      const q = query(
        taskCol,
        where('userID', '==', userID),
        where('status', '==', 'Later'),
        orderBy('dateTime', 'desc')
      );

      const taskSnapshot = await getDocs(q);
      const taskList = taskSnapshot.docs.map(doc => doc.data());

      res.status(200).json({
        success: true,
        message: 'Later tasks retrieved successfully',
        tasks: taskList
      });
    } catch (error) {
      console.error('Error fetching later tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve later tasks',
        error: error.message
      });
    }
  });
} catch (error) {
  console.error('Error fetching tasks:', error);
  res.status(500).json({
    success: false,
    message: 'Failed to retrieve tasks',
    error: error.message
  });
}


module.exports = router;
