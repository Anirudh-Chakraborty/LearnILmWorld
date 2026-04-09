import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const accessFreeDemo = async (req, res) => {
  try {
    console.log('📥 Received booking body:', JSON.stringify(req.body, null, 2));
    const { trainerId, classType, sessionTime, sessionId } = req.body; 

    const studentId = req.user._id; 
    //changed to req.user.studentEmail 
    const studentEmail = req.user.studentEmail || req.user.email; 
    const studentName = req.user.name;

    const existingLog = await Booking.findOne({
      student: studentId, 
      trainer: trainerId,
      bookingType: 'free_demo'
    });

    if (existingLog) {
      return res.status(403).json({ 
        message: "You have already accessed the Free Demo for this trainer." 
      });
    }

    const trainer = await User.findById(trainerId).select('profile.demoVideo');
    
    if (!trainer || !trainer.profile || !trainer.profile.demoVideo) {
      return res.status(404).json({ 
        message: "Demo content not available for this trainer." 
      });
    }

    const newAccessLog = new Booking({
      student: studentId,
      trainer: trainerId,
      studentName: studentName,
      studentEmail: studentEmail, 
      bookingType: 'free_demo',

      // Store classType and sessionTime for analytics
      classType: classType,
      sessionTime: sessionTime,
      sessionId: sessionId,


      status: 'completed',
      paymentStatus: 'na',
      paymentGateway: 'none', 
      paymentMethod: 'none',
      amount: 0
    });

    await newAccessLog.save();

    res.status(200).json({ 
      success: true,
      message: "Access Granted",
      videoUrl: trainer.profile.demoVideo
    });

  } catch (error) {
    console.error("Free Demo Error:", error);
    res.status(500).json({ message: "Server Error Booking controller", error: error.message });
  }
};


//for 100ms
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role; // Assuming you set req.user.role in your authenticate middleware

    // 1. Determine if we should search by student or trainer ID
    let query = {};
    if (role === 'trainer') {
      query = { trainer: userId };
    } else {
      query = { student: userId }; // Default to student
    }

    // 2. Fetch the bookings and populate the user details so the frontend has the names
    const bookings = await Booking.find(query)
      .populate('student', 'name email profile.avatar')
      .populate('trainer', 'name email profile.avatar profile.demoVideo')
      .sort({ createdAt: -1 }); // Show newest bookings first

    res.status(200).json(bookings);

  } catch (error) {
    console.error("Error fetching my bookings:", error);
    res.status(500).json({ message: "Server Error fetching bookings", error: error.message });
  }
};

