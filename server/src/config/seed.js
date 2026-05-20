require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Running database seed...\n');

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schema applied');

    // Clear existing data
    await client.query('DELETE FROM request_logs');
    await client.query('DELETE FROM requests');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE requests_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE request_logs_id_seq RESTART WITH 1');
    console.log('✅ Existing data cleared');

    // Seed users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@1234', salt);

    const usersResult = await client.query(
      `INSERT INTO users (name, email, password, role) VALUES
        ('Arjun Kumar',  'user@test.com',    $1, 'user'),
        ('Meena Sharma', 'manager@test.com', $1, 'manager'),
        ('Ravi Admin',   'admin@test.com',   $1, 'admin')
       RETURNING id, name, email, role`,
      [hashedPassword]
    );

    const [user, manager, admin] = usersResult.rows;
    console.log(`✅ Users seeded: ${usersResult.rows.map(u => u.email).join(', ')}`);

    // Seed requests
    const requestsData = [
      {
        title: 'Laptop Upgrade Request',
        description: 'My current laptop is 5 years old and struggling with development tools. Requesting a new MacBook Pro.',
        category: 'IT Equipment',
        priority: 'High',
        status: 'Submitted',
        user_id: user.id,
      },
      {
        title: 'Annual Conference Travel Approval',
        description: 'Requesting approval to attend ReactConf 2025 in San Francisco. Budget: ₹85,000.',
        category: 'Travel',
        priority: 'Medium',
        status: 'Approved',
        user_id: user.id,
      },
      {
        title: 'Software License — Figma Pro',
        description: 'Team needs Figma Pro licenses for 3 developers to improve UI collaboration.',
        category: 'Software',
        priority: 'Medium',
        status: 'Needs Clarification',
        user_id: user.id,
      },
      {
        title: 'Office Chair Replacement',
        description: 'Current chair is causing back issues. Requesting ergonomic replacement.',
        category: 'Office Supplies',
        priority: 'Low',
        status: 'Rejected',
        user_id: user.id,
      },
      {
        title: 'AWS Training & Certification',
        description: 'Request approval for AWS Solutions Architect certification course and exam fee.',
        category: 'Training',
        priority: 'High',
        status: 'Closed',
        user_id: user.id,
      },
      {
        title: 'Remote Work Equipment — Standing Desk',
        description: 'Requesting standing desk for home office setup to improve productivity.',
        category: 'IT Equipment',
        priority: 'Low',
        status: 'Submitted',
        user_id: user.id,
      },
      {
        title: 'Team Building Event Budget',
        description: 'Requesting ₹25,000 budget for Q3 team outing. Estimated 12 team members.',
        category: 'Events',
        priority: 'Medium',
        status: 'Submitted',
        user_id: user.id,
      },
      {
        title: 'VPN Access for Remote Contractor',
        description: 'New contractor joining next Monday needs VPN access to internal systems.',
        category: 'IT Access',
        priority: 'Urgent',
        status: 'Reopened',
        user_id: user.id,
      },
    ];

    const insertedRequests = [];
    for (const r of requestsData) {
      const result = await client.query(
        `INSERT INTO requests (title, description, category, priority, status, user_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [r.title, r.description, r.category, r.priority, r.status, r.user_id]
      );
      insertedRequests.push(result.rows[0]);
    }
    console.log(`✅ ${insertedRequests.length} requests seeded`);

    // Seed audit logs
    const logEntries = [
      // Request 1 (Submitted)
      { req: 0, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },

      // Request 2 (Approved)
      { req: 1, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 1, old: 'Submitted', new: 'Approved', by: manager.id, role: 'manager', comment: 'Conference aligns with our learning goals. Approved.' },

      // Request 3 (Needs Clarification)
      { req: 2, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 2, old: 'Submitted', new: 'Needs Clarification', by: manager.id, role: 'manager', comment: 'Please provide the number of licenses needed and monthly cost breakdown.' },

      // Request 4 (Rejected)
      { req: 3, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 3, old: 'Submitted', new: 'Rejected', by: manager.id, role: 'manager', comment: 'Budget freeze in Q2. Please resubmit in Q3.' },

      // Request 5 (Closed)
      { req: 4, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 4, old: 'Submitted', new: 'Approved', by: manager.id, role: 'manager', comment: 'Approved. AWS cert is a priority skill for the team.' },
      { req: 4, old: 'Approved', new: 'Closed', by: admin.id, role: 'admin', comment: 'Training completed successfully. Closing.' },

      // Request 6, 7 (Submitted)
      { req: 5, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 6, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },

      // Request 8 (Reopened)
      { req: 7, old: null, new: 'Submitted', by: user.id, role: 'user', comment: 'Request created' },
      { req: 7, old: 'Submitted', new: 'Approved', by: manager.id, role: 'manager', comment: 'Approved.' },
      { req: 7, old: 'Approved', new: 'Closed', by: admin.id, role: 'admin', comment: 'Access provisioned.' },
      { req: 7, old: 'Closed', new: 'Reopened', by: admin.id, role: 'admin', comment: 'Contractor extended contract. Reopening for access review.' },
    ];

    for (const log of logEntries) {
      await client.query(
        `INSERT INTO request_logs (request_id, old_status, new_status, changed_by, role, comment)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [insertedRequests[log.req].id, log.old, log.new, log.by, log.role, log.comment]
      );
    }
    console.log(`✅ Audit logs seeded`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Test credentials:');
    console.log('  User:    user@test.com    / Test@1234');
    console.log('  Manager: manager@test.com / Test@1234');
    console.log('  Admin:   admin@test.com   / Test@1234\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch(() => process.exit(1));
