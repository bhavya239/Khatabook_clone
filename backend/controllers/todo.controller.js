const Todo = require('../models/Todo');

// @desc    Get all todos for the logged-in user (filtered by date)
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res) => {
  try {
    const { date } = req.query; // Expecting 'yesterday', 'today', 'tomorrow'
    let query = { user: req.user.id };

    if (date) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const targetDate = new Date(now);
      if (date === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (date === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const endOfDay = new Date(targetDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      query.dueDate = {
        $gte: targetDate,
        $lt: endOfDay,
      };
    }

    const todos = await Todo.find(query)
      .populate('contact', 'name phone')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: todos,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res) => {
  try {
    const { title, amount, type, contact, dueDate } = req.body;

    const todo = await Todo.create({
      user: req.user.id,
      title,
      amount,
      type,
      contact: contact || undefined,
      dueDate: new Date(dueDate || Date.now()),
    });

    res.status(201).json({
      success: true,
      data: todo,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update todo status
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodoStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }

    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    todo.status = status;
    await todo.save();

    res.status(200).json({
      success: true,
      data: todo,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }

    if (todo.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await todo.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
