const express = require('express');
const router = express.Router();
const {
  getTodos,
  createTodo,
  updateTodoStatus,
  deleteTodo,
} = require('../controllers/todo.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
  .get(getTodos)
  .post(createTodo);

router.route('/:id')
  .put(updateTodoStatus)
  .delete(deleteTodo);

module.exports = router;
