/**
 * IBM Full-Stack JavaScript Developer Capstone Project
 * Enterprise Task Management Platform - Backend Server
 * 
 * This Node.js/Express server demonstrates full-stack development competencies
 * from the IBM Full-Stack JavaScript Developer Professional Certificate.
 * 
 * Features:
 * - RESTful API design
 * - MongoDB integration
 * - JWT authentication
 * - CORS handling
 * - Error handling middleware
 * - Input validation
 * - API documentation
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ibm_fullstack_capstone_secret_2025';

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ibm_fullstack_capstone';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Task Schema
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['todo', 'in-progress', 'review', 'completed'], 
        default: 'todo' 
    },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    dueDate: { type: Date },
    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Project Schema
const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], 
        default: 'planning' 
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    budget: { type: Number, min: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Project = mongoose.model('Project', projectSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            error: 'Validation Error', 
            details: Object.values(err.errors).map(e => e.message) 
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({ 
            error: 'Duplicate entry', 
            field: Object.keys(err.keyPattern)[0] 
        });
    }
    
    res.status(500).json({ error: 'Internal server error' });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'IBM Full-Stack JavaScript Capstone API',
        version: '1.0.0'
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        // Find user
        const user = await User.findOne({ 
            $or: [{ username }, { email: username }] 
        });
        
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select('-password')
            .sort({ firstName: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Task routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { status, priority, project, assignedTo, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (project) filter.project = project;
        if (assignedTo) filter.assignedTo = assignedTo;
        
        const tasks = await Task.find(filter)
            .populate('assignedTo', 'firstName lastName username')
            .populate('createdBy', 'firstName lastName username')
            .populate('comments.user', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Task.countDocuments(filter);
        
        res.json({
            tasks,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            createdBy: req.user.userId,
            updatedAt: new Date()
        };
        
        const task = new Task(taskData);
        await task.save();
        
        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'firstName lastName username')
            .populate('createdBy', 'firstName lastName username');
        
        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('assignedTo', 'firstName lastName username')
        .populate('createdBy', 'firstName lastName username');
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Project routes
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('owner', 'firstName lastName username')
            .populate('team', 'firstName lastName username')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projectData = {
            ...req.body,
            owner: req.user.userId,
            updatedAt: new Date()
        };
        
        const project = new Project(projectData);
        await project.save();
        
        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'firstName lastName username')
            .populate('team', 'firstName lastName username');
        
        res.status(201).json(populatedProject);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Analytics routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        const [
            totalTasks,
            completedTasks,
            totalProjects,
            activeProjects,
            tasksByStatus,
            tasksByPriority,
            recentTasks
        ] = await Promise.all([
            Task.countDocuments(),
            Task.countDocuments({ status: 'completed' }),
            Project.countDocuments(),
            Project.countDocuments({ status: 'active' }),
            Task.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Task.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),
            Task.find()
                .populate('assignedTo', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        
        res.json({
            summary: {
                totalTasks,
                completedTasks,
                totalProjects,
                activeProjects,
                completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
            },
            charts: {
                tasksByStatus,
                tasksByPriority
            },
            recentTasks
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 IBM Full-Stack JavaScript Capstone Server running on port ${PORT}`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
    console.log(`🎓 IBM Full-Stack JavaScript Developer Professional Certificate Project`);
});

module.exports = app;

