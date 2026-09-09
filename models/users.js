const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const findByEmail = async (email) => {
	const [rows] = await pool.execute(
		'SELECT * FROM users WHERE email = ? LIMIT 1',
		[email]
	);
	return rows[0] || null;
};

const findById = async (id) => {
	const [rows] = await pool.execute(
		'SELECT * FROM users WHERE id = ? LIMIT 1',
		[id]
	);
	return rows[0] || null;
};

const create = async ({ name, email, password, phone, location, bio, is_vendor }) => {
	const passwordHash = await bcrypt.hash(password, 10);
	const avatarInitials = name
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 10);

	const [result] = await pool.execute(
		`INSERT INTO users
			(name, email, password_hash, phone, location, bio, avatar_initials, is_vendor)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[name, email, passwordHash, phone || null, location || null, bio || null, avatarInitials, Boolean(is_vendor)]
	);

	return findById(result.insertId);
};

const comparePassword = (password, passwordHash) => {
	return bcrypt.compare(password, passwordHash);
};

module.exports = { findByEmail, findById, create, comparePassword };
