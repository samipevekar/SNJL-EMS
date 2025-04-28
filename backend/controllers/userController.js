import { query } from '../db/db.js';
import bcrypt from 'bcrypt';

import { generateJwtToken } from '../utils/generateJwtToken.js';





// Check if all assigned shop IDs exist
async function validateShops(shopIds) {
  if (!shopIds || shopIds.length === 0) return true; // No shops assigned, so valid

  const { rows } = await query('SELECT shop_id FROM shops WHERE shop_id = ANY($1)', [shopIds]);
  const existingShopIds = rows.map(row => row.shop_id);

  return shopIds.every(id => existingShopIds.includes(id));
}

// Register New User (Super User can create managers & users, Manager can create only users)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role,assigned_shops, image } = req.body;
    const userId = req.user?.id
    const roles = req.user?.role
    console.log(userId,roles)
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({success:false, error: 'Name, email, password, and role are required.' });
    }

    if(password.length < 6){
      return res.status(400).json({success:false, error: 'Password must be at least 6 characters'})
    }

    if(role === "user" && assigned_shops.length > 1){
      return res.status(400).json({success:false, error: 'Users can only be assigned to one shop'})
    }

    if((role === "user" || role === "manager") && assigned_shops.length === 0 ){
      return res.status(400).json({ success: false, error: 'Assigned shop is required'})
    }

    // Fetch the role of the requester
    const adminCheck = await query('SELECT role FROM users WHERE id = $1', [userId]);

    if (userId && adminCheck.rows.length === 0) {
      return res.status(403).json({success:false, error: 'Unauthorized request.' });
    }

    const requesterRole = adminCheck.rows[0]?.role;

    // Super User can create managers and users, Manager can only create users
    if (userId && requesterRole === 'manager' && role !== 'user') {
      return res.status(403).json({success:false, error: 'Managers can only create users.' });
    }

    if (userId && requesterRole !== 'super_user' && requesterRole !== 'manager') {
      return res.status(403).json({success:false, error: 'Only super users and managers can create users.' });
    }

    // Check if email already exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({success:false, error: 'Email is already registered.' });
    }

    // check assigned shops exists
    if (assigned_shops && !(await validateShops(assigned_shops))) {
      return res.status(400).json({success:false, error: 'One or more assigned shops do not exist.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process face encoding if an image is provided
    let faceEncoding = null;
    if (image) {
      faceEncoding = await getFaceEncoding(image);
    }

    // Insert user into database
    const result = await query(
      'INSERT INTO users (name, email, password, role, face_encoding,assigned_shops) VALUES ($1, $2, $3, $4, $5,$6) RETURNING id, name, email, role,assigned_shops',
      [name, email, hashedPassword, role, faceEncoding,assigned_shops]
    );

    res.status(201).json({success:true, message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, error: 'Server error during user registration' });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email,password)
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Fetch user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // generate token 
    const token = generateJwtToken(user.id, user.role)

    res.json({success:true, message: 'Login successful', user:user, token:token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// edit user
export const editUser = async (req, res) => {
  try {
    const { userId } = req.params; // User ID to be edited
    const { name, email, password, role, assigned_shops } = req.body;
    const requesterId = req.user?.id; // Logged-in user ID

    const requesterRole = req.user?.role; // Logged-in user role


    if (!requesterId) {
      return res.status(403).json({success:false, error: 'Unauthorized request.' });
    }

    if(role === "user" && assigned_shops.length > 1){
      return res.status(400).json({success:false, error: 'Users can only be assigned to one shop'})
    }

    // Fetch user to be edited
    const userToEdit = await query('SELECT id, role FROM users WHERE id = $1', [userId]);

    if (userToEdit.rows.length === 0) {
      return res.status(404).json({success:false, error: 'User not found.' });
    }

    const checkEmail = await query('SELECT * from users WHERE email = $1', [email])
    if(checkEmail.rowCount>0){
      if(checkEmail.rows[0].email !== userToEdit.rows[0].email){
        return res.status(400).json({success:false, error: 'Email already exist'})
      }
    }

    const targetUser = userToEdit.rows[0];

    // Permission Logic
    if (requesterId !== targetUser.id) {
      if (requesterRole === 'manager' && (targetUser.role === 'manager' || targetUser.role === 'super_user')) {
        return res.status(403).json({success:false, error: 'Managers can only edit users and themselves.' });
      }

      if (requesterRole === 'user') {
        return res.status(403).json({success:false, error: 'Users can only edit their own profile.' });
      }

      if (requesterRole !== 'super_user' && requesterRole !== 'manager') {
        return res.status(403).json({success:false, error: 'Unauthorized access.' });
      }
    }

    // Role change restrictions
    if (role) {
      if (requesterId === 'super_user') {
        return res.status(403).json({success:false, error: 'You cannot change your own role.' });
      }

      if (requesterRole === 'manager' && role !== 'user') {
        return res.status(403).json({success:false, error: 'Managers can only assign the user role.' });
      }

      if (requesterRole !== 'super_user') {
        return res.status(403).json({success:false, error: 'Only super users can change roles.' });
      }
    }

    // check assigned shop exists
    if (assigned_shops && !(await validateShops(assigned_shops))) {
      return res.status(400).json({success:false, error: 'One or more assigned shops do not exist.' });
    }

    // If password is being updated, hash it
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user details
    const updatedUser = await query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        password = COALESCE($3, password),
        role = COALESCE($4, role),
        assigned_shops = COALESCE($5, assigned_shops)
        WHERE id = $6 RETURNING id, name, email, role, assigned_shops`,
      [name, email, hashedPassword || null, role || targetUser.role, assigned_shops,userId]
    );

    res.json({success:true, message: 'User updated successfully', user: updatedUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during user update' });
  }
};

export const getMe = async (req,res) =>{
  const {id} = req.user
  try {
    const user = await query(`SELECT * FROM users WHERE id = $1`, [id])
    if(user.rowCount === 0){
      return res.status(404).json({error: 'User not found.'})
    }

    const { password, ...userInfo } = user.rows[0]

    res.json(userInfo)    
  } catch (error) {    
    console.error(error);
    res.status(500).json({ error: 'Server error during user update' });
  }
}

// Get all users (filter by role if provided)
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const requesterRole = req.user?.role;

    // Basic permission check
    if (requesterRole !== 'super_user' && requesterRole !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    let queryText = 'SELECT id, name, email, role, assigned_shops FROM users';
    const queryParams = [];
    

    // Managers can only see users, not other managers or super users
    if (requesterRole === 'manager') {
      queryText += ' WHERE role = $1 ';
      queryParams.push('user');
    } else if (role) {
      queryText += ' WHERE role = $1 ';
      queryParams.push(role);
    } 

    if(queryParams.length==0){
      queryText = 'SELECT id, name, email, role, assigned_shops FROM users ORDER BY id'
    }

    const result = await query(queryText, queryParams.length > 0 ? queryParams : null);

    res.json({ 
      success: true,
      users: result.rows 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
};











// Attendance Route
export const attendance = async (req, res) => {
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
