import { query } from "../db/db.js";
import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import path from 'path';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load face recognition models
const modelsPath = path.join(process.cwd(), 'models');
async function loadFaceModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
  console.log('✅ Face Recognition Models Loaded Successfully');
}
await loadFaceModels();

// Convert Base64 image to Canvas
async function getFaceEncoding(base64Image) {
  const imgBuffer = Buffer.from(base64Image, 'base64');
  const img = new Image();
  img.src = imgBuffer;
  const c = new Canvas(img.width, img.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const detections = await faceapi.detectSingleFace(c).withFaceLandmarks().withFaceDescriptor();
  if (!detections) return null;
  return Array.from(detections.descriptor).toString();
}

// Attendance Route
export const markAttendance = async (req, res) => {
  try {
    const { user_id, image } = req.body;
    if (!user_id || !image) {
      return res.status(400).json({ error: 'user_id and image are required.' });
    }
    const userResult = await query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userResult.rows[0];

    
    // check user already mark the attendacne
    const attendanceResult = await query(
      `
      SELECT * FROM attendance 
      WHERE user_id = $1 AND attendance_date = CURRENT_DATE
      `,
      [user_id]
    )

    if(attendanceResult.rowCount > 0){
      return res.status(400).json({ error: 'User already marked attendance for today.' });
    }

    const newEncoding = await getFaceEncoding(image);
    if (!newEncoding) {
      return res.status(400).json({ error: 'Face not detected. Try again.' });
    }

    if (!user.face_encoding) {
      await query('UPDATE users SET face_encoding = $1 WHERE id = $2', [newEncoding, user_id]);
    } else {
      const storedEncoding = user.face_encoding.split(',').map(Number);
      const inputEncoding = newEncoding.split(',').map(Number);
      const distance = faceapi.euclideanDistance(storedEncoding, inputEncoding);
      if (distance > 0.6) {
        return res.status(401).json({ error: 'Face does not match. Attendance not marked.' });
      }
    }


    await query('INSERT INTO attendance (user_id) VALUES ($1)', [user_id]);
    res.json({ message: 'Attendance marked successfully.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Server error during attendance marking' });
  }
};


// Get attendance by shop with optional month & year filters

export const getAttendanceByShop = async (req, res) => {
  try {
    const { shop_id } = req.params;
    const { role, month, year } = req.query;

    // Validate month and year if provided
    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: "Month must be between 1 and 12" });
    }
    if (year && year.length !== 4) {
      return res.status(400).json({ error: "Year must be 4 digits" });
    }

    // Default role filter - now strictly enforces the provided role
    const roleCondition = role ? `u.role = $2` : `u.role IN ('user', 'manager')`;
    let queryParams = role ? [shop_id, role] : [shop_id];
    let dateCondition = "";
    let dateFilterApplied = false;

    // Add conditions for month & year
    if (month && year) {
      dateCondition = `AND EXTRACT(MONTH FROM a.attendance_date) = $${queryParams.length + 1} AND EXTRACT(YEAR FROM a.attendance_date) = $${queryParams.length + 2}`;
      queryParams.push(month, year);
      dateFilterApplied = true;
    } else if (month) {
      dateCondition = `AND EXTRACT(MONTH FROM a.attendance_date) = $${queryParams.length + 1}`;
      queryParams.push(month);
      dateFilterApplied = true;
    } else if (year) {
      dateCondition = `AND EXTRACT(YEAR FROM a.attendance_date) = $${queryParams.length + 1}`;
      queryParams.push(year);
      dateFilterApplied = true;
    }

    // First, get all users assigned to this shop with the specified role
    const usersQuery = `
      SELECT u.id, u.name, u.email 
      FROM users u
      WHERE ${roleCondition} 
      AND $1 = ANY(u.assigned_shops)
    `;

    const usersResult = await query(usersQuery, role ? [shop_id, role] : [shop_id]);
    const users = usersResult.rows;

    if (users.length === 0) {
      return res.status(200).json([]);
    }

    // Get attendance data for these users
    const attendanceQuery = `
      SELECT 
        a.user_id,
        COUNT(a.id) as attendance_count,
        ARRAY_AGG(DISTINCT a.attendance_date::DATE) as present_dates
      FROM attendance a
      WHERE a.user_id = ANY($1)
      ${dateCondition}
      GROUP BY a.user_id
    `;

    const attendanceResult = await query(
      attendanceQuery,
      [users.map(u => u.id), ...queryParams.slice(1)]
    );

    const attendanceMap = new Map();
    attendanceResult.rows.forEach(row => {
      attendanceMap.set(row.user_id, {
        count: row.attendance_count,
        present_dates: row.present_dates
      });
    });

    // Calculate dates up to current date if month and year are provided
    let allDatesInPeriod = [];
    const currentDate = new Date();
    
    if (month && year) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      
      // Only include dates up to current date if it's the current month and year
      const endDay = (yearNum === currentDate.getFullYear() && monthNum === currentDate.getMonth() + 1)
        ? currentDate.getDate()
        : daysInMonth;
      
      allDatesInPeriod = Array.from({ length: endDay }, (_, i) => {
        const day = i + 1;
        return new Date(yearNum, monthNum - 1, day).toISOString().split('T')[0];
      });
    } else if (year) {
      // For year-only filter, get all dates up to current date if it's the current year
      const yearNum = parseInt(year);
      const endMonth = (yearNum === currentDate.getFullYear())
        ? currentDate.getMonth() + 1
        : 12;
      
      for (let m = 1; m <= endMonth; m++) {
        const daysInMonth = new Date(yearNum, m, 0).getDate();
        const endDay = (yearNum === currentDate.getFullYear() && m === currentDate.getMonth() + 1)
          ? currentDate.getDate()
          : daysInMonth;
        
        for (let d = 1; d <= endDay; d++) {
          allDatesInPeriod.push(new Date(yearNum, m - 1, d).toISOString().split('T')[0]);
        }
      }
    }

    // Prepare final response
    const response = users.map(user => {
      const attendanceData = attendanceMap.get(user.id) || { count: 0, present_dates: [] };
      
      // Format present dates to YYYY-MM-DD
      const formattedPresentDates = attendanceData.present_dates.map(date => {
        return new Date(date).toISOString().split('T')[0];
      });

      let absent_dates = [];
      if (dateFilterApplied) {
        // Only calculate absent dates if we have a date filter
        // First, ensure we're comparing dates in the same format
        const presentDatesSet = new Set(formattedPresentDates);
        
        // Filter all dates in period to find those not in present dates
        absent_dates = allDatesInPeriod.filter(date => 
          !presentDatesSet.has(date)
        );
      }

      return {
        user_id: user.id,
        name: user.name,
        email: user.email,
        attendance_count: attendanceData.count,
        present_dates: formattedPresentDates,
        absent_dates: absent_dates
      };
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching attendance by shop:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};