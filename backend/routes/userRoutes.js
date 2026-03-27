import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import ClassSchedule from '../models/ClassSchedule.js'
import Booking from '../models/Booking.js'

const router = express.Router();

// Get all trainers
router.get('/trainers', async (req, res) => {
  try {
    const {
      language,
      specialization,
      hobby,
      minRate,
      maxRate,
      experience,
      rating,
      availability,
      search,
      nationality,
      sortBy,
      bookingType //for group and private in filter pannel
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    let query = { role: 'trainer', isActive: true };

    //booking type private or group
    if (bookingType) {
      if (bookingType === 'group') {
        // GROUP: Find all the teachernthat have a pre-created future group class
        const activeTeacherIds = await ClassSchedule.distinct('teacherId', {
          type: 'group',
          status: { $ne: 'cancelled' },
          startTime: { $gte: new Date() } 
        });
        
        query._id = { $in: activeTeacherIds };
        
      } else if (bookingType === 'private') {
        // PRIVATE: works on the available slots
        query['profile.availability'] = { 
          $elemMatch: { available: true } 
        };
      }
    }

    // Language filter (both arrays supported)
    if (language) {
      const regex = new RegExp(language, 'i');
      query.$or = [
        { 'profile.languages': { $in: [regex] } },
        { 'profile.trainerLanguages.language': regex }
      ];
    }

    // Specialization
    if (specialization) {
      query['profile.specializations'] = { $in: [new RegExp(specialization, 'i')] };
    }

    // Hobby filter
    if (hobby) {
      query['profile.hobbies'] = { $in: [new RegExp(hobby, 'i')] };
    }

    // Nationality
    if (nationality) {
      query['profile.nationalityCode'] = nationality;
    }

    // Price Filters
    if (minRate || maxRate) {
      query['profile.hourlyRate'] = {};
      if (minRate) query['profile.hourlyRate'].$gte = parseFloat(minRate);
      if (maxRate) query['profile.hourlyRate'].$lte = parseFloat(maxRate);
    }

    // Experience
    if (experience) {
      query['profile.experience'] = { $gte: parseInt(experience) };
    }

    // Rating
    if (rating) {
      query['stats.rating'] = { $gte: parseFloat(rating) };
    }

    // Availability
    if (availability === "true") {
      query['profile.isAvailable'] = true;
    }

    // Search (name, bio, langs, specialization, hobbies)
    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [
        { name: reg },
        { 'profile.bio': reg },
        { 'profile.languages': { $in: [reg] } },
        { 'profile.specializations': { $in: [reg] } },
        { 'profile.hobbies': { $in: [reg] } },
      ];
    }

    let trainersQuery = User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit);

    // Sorting
    switch (sortBy) {
      case 'price_low':
        trainersQuery.sort({ 'profile.hourlyRate': 1 });
        break;
      case 'price_high':
        trainersQuery.sort({ 'profile.hourlyRate': -1 });
        break;
      case 'experience':
        trainersQuery.sort({ 'profile.experience': -1 });
        break;
      default:
        trainersQuery.sort({ 'stats.rating': -1 });
    }

    const trainers = await trainersQuery;
    const totalCount = await User.countDocuments(query);

    // 2. Calculate Monthly Earnings dynamically
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const trainerIds = trainers.map(t => t._id);

    // Aggregate completed classes for this month
    const monthlyEarningsAggr = await ClassSchedule.aggregate([
      {
        $match: {
          teacherId: { $in: trainerIds },
          status: 'completed', // Make sure this matches your actual completion status string
          startTime: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$teacherId',
          monthlyTotal: { $sum: '$price' } // Replace '$price' with the actual price field in your ClassSchedule model if it's named differently
        }
      }
    ]);

    // Create a dictionary map for fast lookup
    const earningsMap = monthlyEarningsAggr.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.monthlyTotal;
      return acc;
    }, {});

    // 3. Attach the calculated monthly earnings to the trainer objects
    const trainersWithEarnings = trainers.map(trainer => {
      const trainerObj = trainer.toObject();
      trainerObj.monthlyEarnings = earningsMap[trainer._id.toString()] || 0;
      return trainerObj;
    });

    // 4. Send the updated array to the frontend
    res.json({ trainers: trainersWithEarnings, page, totalCount, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// update user
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;


    // forbidden fields
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const existingUser = await User.findById(req.user._id);
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    // if (updates.hasOwnProperty('secondaryEmail')) {

    //   if (updates.secondaryEmail === '') {
    //     existingUser.secondaryEmail = undefined
    //     delete updates.secondaryEmail;
    //   }

    //   else {
    //     const emailInUse = await User.findOne({
    //       secondaryEmail: updates.secondaryEmail,
    //       _id: { $ne: existingUser._id }
    //     });
    //     if (emailInUse) {
    //       return res.status(400).json({ message: 'This secondary email is already in use' });
    //     }
    //     existingUser.secondaryEmail = updates.secondaryEmail; // update it safely
    //     delete updates.secondaryEmail; // remove from updates to avoid double-assign
    //   }
    // }

    // MERGE, DON'T REPLACE PROFILE
    if (updates.profile) {
      existingUser.profile = {
        ...existingUser.profile.toObject(),
        ...updates.profile
      };
      delete updates.profile;
    }

    // apply top-level updates
    Object.assign(existingUser, updates);

    const savedUser = await existingUser.save();
    const userToSend = savedUser.toObject();
    delete userToSend.password;
    // userToSend.secondaryEmail = savedUser.secondaryEmail || '';

    // console.log("SAFE UPDATED USER:", userToSend);

    res.json(userToSend);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('stats');
    
    // 1. Define the start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 2. Aggregate Monthly Earnings from ClassSchedule (e.g., Group Classes)
    const classEarnings = await ClassSchedule.aggregate([
      {
        $match: {
          teacherId: req.user._id,
          status: 'completed', // Only count completed classes
          startTime: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          monthlyTotal: { $sum: '$price' }
        }
      }
    ]);

    const totalClassEarnings = classEarnings.length > 0 ? classEarnings[0].monthlyTotal : 0;

    // 3. (Optional but recommended) Aggregate Monthly Earnings from Bookings (Private Sessions)
    // Only include this if private sessions have a 'price' field and are stored in the Booking model
    const bookingEarnings = await Booking.aggregate([
      {
        $match: {
          trainer: req.user._id,
          paymentStatus: 'completed', // or whatever indicates a paid/completed session
          createdAt: { $gte: startOfMonth } // Adjust date field if your Booking model uses a different field
        }
      },
      {
        $group: {
          _id: null,
          monthlyTotal: { $sum: '$price' } // Adjust '$price' if your Booking model uses a different field name for cost
        }
      }
    ]);

    const totalBookingEarnings = bookingEarnings.length > 0 ? bookingEarnings[0].monthlyTotal : 0;

    // 4. Combine earnings and send to frontend
    const finalMonthlyEarnings = totalClassEarnings + totalBookingEarnings;

    res.json({
      ...user.stats.toObject(),
      monthlyEarnings: finalMonthlyEarnings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;