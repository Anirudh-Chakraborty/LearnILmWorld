import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import Session from '../models/Session.js'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { generateToken04 } from '../utils/zegoToken.js'
import HMSTokenService from '../utils/hmsToken.js'; 
import APIService  from '../utils/APIService.js';

const router = express.Router()

const tokenService = new HMSTokenService();
const apiService = new APIService(tokenService);

//100ms create room by trainer
router.post('/create-room', authenticate, authorize(['trainer']), async (req, res) => {
  try {
    const {
      title,
      description,
      bookingIds,
      duration,
      maxStudents,
      language,
      level,
      scheduledDate,
      template_id, // Add if needed for 100ms
      region       // Add if needed for 100ms
    } = req.body

    const bookings = await Booking.find({
      _id: { $in: bookingIds },
      trainer: req.user._id,
      paymentStatus: 'completed'
    })

    if (!bookings.length) {
      return res.status(400).json({ message: 'No valid bookings found' })
    }

    const studentIds = bookings.map(b => b.student)

    // 1. Create room via 100ms API
    const hmsPayload = {
      name: `${title.replace(/\s+/g, '-')}-${uuidv4().substring(0, 8)}`,
      description: description || 'Live Session',
      template_id: process.env.HMS_TEMPLATE_ID, // Provide your 100ms template ID from frontend or .env
      region: region || "in",
    };
    
    let roomData;
    try {
        roomData = await apiService.post("/rooms", hmsPayload);
    } catch (apiErr) {
        console.error("100ms API Error:", apiErr);
        return res.status(500).json({ message: "Failed to create 100ms room" });
    }

    // 2. Create session in DB using the 100ms room ID
    const session = await Session.create({
      trainer: req.user._id,
      students: studentIds,
      bookings: bookingIds,
      title,
      description,
      roomId: roomData.id, // Use 100ms room ID
      duration,
      maxStudents,
      language,
      level,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date()
    })

    await Booking.updateMany(
      { _id: { $in: bookingIds } },
      { sessionId: session._id, roomId: roomData.id } // Also update roomId in Booking if you added it
    )

    // await User.findByIdAndUpdate(req.user._id, {
    //   $inc: { 'stats.totalSessions': 1 }
    // })

    res.status(201).json({ session, roomData })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})


// Create session (Trainer only)
// router.post('/', authenticate, authorize(['trainer']), async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       bookingIds,
//       duration,
//       maxStudents,
//       language,
//       level,
//       scheduledDate
//     } = req.body

//     const bookings = await Booking.find({
//       _id: { $in: bookingIds },
//       trainer: req.user._id,
//       paymentStatus: 'completed'
//     })

//     if (!bookings.length) {
//       return res.status(400).json({ message: 'No valid bookings found' })
//     }

//     const studentIds = bookings.map(b => b.student)

//     const session = await Session.create({
//       trainer: req.user._id,
//       students: studentIds,
//       bookings: bookingIds,
//       title,
//       description,
//       roomId: `session_${uuidv4()}`, //ZEGO room key
//       duration,
//       maxStudents,
//       language,
//       level,
//       scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date()
//     })

//     await Booking.updateMany(
//       { _id: { $in: bookingIds } },
//       { sessionId: session._id }
//     )

//     await User.findByIdAndUpdate(req.user._id, {
//       $inc: { 'stats.totalSessions': 1 }
//     })

//     res.status(201).json(session)
//   } catch (err) {
//     res.status(400).json({ message: err.message })
//   }
// })

//100ms Get sessions for logged-in user
router.get('/my-sessions', authenticate, async (req, res) => {
  try {
    const query =
      req.user.role === 'trainer'
        ? { trainer: req.user._id }
        : { students: req.user._id }

    const sessions = await Session.find(query)
      .populate('trainer', 'name email profile')
      .populate('students', 'name email')
      .populate('bookings')
      .sort({ createdAt: -1 })

    res.json(sessions)
  } catch (err) {
    console.error('Error in /my-sessions:', err);
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Get session by ID
// router.get('/:id', authenticate, async (req, res) => {
//   try {
//     const session = await Session.findById(req.params.id)
//       .populate('trainer', 'name email profile')
//       .populate('students', 'name email')
//       .populate('bookings')

//     if (!session) {
//       return res.status(404).json({ message: 'Session not found' })
//     }

//     const allowed =
//       session.trainer._id.toString() === req.user._id.toString() ||
//       session.students.some(s => s._id.toString() === req.user._id.toString())

//     if (!allowed) {
//       return res.status(403).json({ message: 'Access denied' })
//     }

//     res.json(session)
//   } catch (err) {
//     res.status(500).json({ message: err.message })
//   }
// })

// 100ms get session by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('trainer', 'name email profile')
      .populate('students', 'name email')
      .populate('bookings')

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const allowed =
      session.trainer._id.toString() === req.user._id.toString() ||
      session.students.some(s => s._id.toString() === req.user._id.toString())

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(session)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// 100ms: Join Room & Get Auth Token
router.post('/join-room', authenticate, async (req, res) => {
  const { session_id} = req.body;
  console.log("before const")
  
  if (!session_id) {
    return res.status(400).json({ success: false, msg: "session_id and role are required" });
  }
  console.log("before try")
  try {
    console.log('afete try')
    const session = await Session.findById(session_id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const isTrainerOwner = session.trainer.toString() === req.user._id.toString();
    const isStudent = session.students.some(s => s.toString() === req.user._id.toString());
    const isAdmin = (req.user.role === 'admin') || (req.user.email === process.env.ADMIN_EMAIL);

    if (!isTrainerOwner && !isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (!['scheduled', 'active'].includes(session.status)) {
      return res.status(403).json({ message: 'Session not joinable' })
    }

    const room_id = session.roomId;
    const user_id = req.user._id.toString();

    let hmsRole = "student"; 
    
    if (isTrainerOwner) {
      hmsRole = "host"; 
    } else if (isAdmin) {
      hmsRole = "admin";
    }

    // Verify room exists in 100ms
    const roomData = await apiService.get(`/rooms/${room_id}`);
    console.log('100ms Room data:', roomData);

    // 2. Pass the mapped 'hmsRole' instead of 'role'
    const token = tokenService.getAuthToken({ room_id, user_id, role: hmsRole });
    
    res.json({
      success: true,
      token,
      roomData: roomData,
      userName: req.user.name,
      hmsRole: hmsRole,
      msg: "Joined room successfully!",
    });
  } catch (err) {
    console.error(err);
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ success: false, msg: "Room not found on 100ms" });
    }
    res.status(500).send("Internal Server Error");
  }
});


//100ms Force end session (Trainer/Admin)
router.post('/end-room/:id', authenticate, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const isTrainerOwner = req.user.role === 'trainer' && session.trainer.toString() === req.user._id.toString();
    const isAdmin = req.user.email === process.env.ADMIN_EMAIL;

    if (!isTrainerOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const room_id = session.roomId;

    if (room_id) {
        try {
            const payload = { enabled: false };
            await apiService.post(`/rooms/${room_id}`, payload);
            console.log(`100ms room ${room_id} disabled successfully.`);
        } catch (hmsError) {
             console.error("100ms API Error ending room:", hmsError.response?.data || hmsError.message);
        }
    }

    session.status = 'ended'
    await session.save()

    await Booking.updateMany({ sessionId: session._id }, { status: 'completed' })
    await User.findByIdAndUpdate(session.trainer, { $inc: { 'stats.completedSessions': 1 } })
    await User.updateMany({ _id: { $in: session.students } }, { $inc: { 'stats.completedSessions': 1 } })

    res.json({ success: true, message: 'Session ended' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// session updation by admin + trainer(owner)
// router.put('/:id', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
//   const session = await Session.findById(req.params.id)
//   if (!session) return res.status(404).json({ message: 'Not found' })

//   // Trainer can only edit their own session
//   if (
//     req.user.role === 'trainer' &&
//     session.trainer.toString() !== req.user._id.toString()
//   ) {
//     return res.status(403).json({ message: 'Access denied' })
//   }

//   if (session.status === 'ended') {
//     return res.status(400).json({ message: 'Cannot update ended session' })
//   }

//   const updates = req.body

//   // Hard locks
//   delete updates.roomId
//   delete updates.trainer
//   delete updates.students
//   delete updates.bookings
//   delete updates.status

//   const updated = await Session.findByIdAndUpdate(
//     req.params.id,
//     { $set: updates },
//     { new: true, runValidators: true }
//   )

//   res.json(updated)
// })

// session updation by admin + trainer(owner)
// router.put('/:id', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
//   const session = await Session.findById(req.params.id)
//   if (!session) return res.status(404).json({ message: 'Not found' })

//   // Trainer can only edit their own session
//   if (
//     req.user.role === 'trainer' &&
//     session.trainer.toString() !== req.user._id.toString()
//   ) {
//     return res.status(403).json({ message: 'Access denied' })
//   }

//   if (session.status === 'ended') {
//     return res.status(400).json({ message: 'Cannot update ended session' })
//   }

//   const updates = req.body

//   // Hard locks
//   delete updates.roomId
//   delete updates.trainer
//   delete updates.students
//   delete updates.bookings
//   delete updates.status

//   const updated = await Session.findByIdAndUpdate(
//     req.params.id,
//     { $set: updates },
//     { new: true, runValidators: true }
//   )

//   res.json(updated)
// })

//100ms session status updates
router.put('/:id/status', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
  const { status, roomId } = req.body // Destructure roomId from body
  const ALLOWED = ['scheduled', 'active', 'cancelled', 'ended'] // Added ended if needed here

  const session = await Session.findById(req.params.id)
  if (!session) return res.status(404).json({ message: 'Not found' })

  // cannot regress a session life cycle check
  const transitions = {
    scheduled: ['active', 'cancelled'],
    active: ['cancelled', 'ended'], // Allow moving from active to ended here if needed
    cancelled: [],
    ended: []
  }

  if (!transitions[session.status]?.includes(status)) {
    return res.status(400).json({ message: 'Invalid status transition' })
  }

  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  if (
    req.user.role === 'trainer' &&
    session.trainer.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: 'Access denied' })
  }

  if (session.status === 'ended') {
    return res.status(400).json({ message: 'Session already ended' })
  }

  session.status = status;
  
  // If a roomId is passed when activating the session, save it
  if (roomId && status === 'active') {
      session.roomId = roomId;
  }
  
  await session.save()

  // Update related bookings if activating the session
  if(roomId && status === 'active'){
     await Booking.updateMany(
        { sessionId: session._id },
        { roomId: roomId, status: 'active' }
      )
  }

  res.json(session)
})

// create room for teacher


export default router

