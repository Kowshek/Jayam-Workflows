const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const { validateTransition, getAvailableTransitions, STATUS } = require('../config/workflow');

// ─── Helpers ────────────────────────────────────────────────────────────────

const buildFilters = (params, startIdx = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIdx;

  if (params.status) {
    conditions.push(`r.status = $${idx++}`);
    values.push(params.status);
  }
  if (params.category) {
    conditions.push(`r.category = $${idx++}`);
    values.push(params.category);
  }
  if (params.priority) {
    conditions.push(`r.priority = $${idx++}`);
    values.push(params.priority);
  }
  if (params.from) {
    conditions.push(`r.created_at >= $${idx++}`);
    values.push(new Date(params.from));
  }
  if (params.to) {
    conditions.push(`r.created_at <= $${idx++}`);
    values.push(new Date(params.to + 'T23:59:59'));
  }

  return { conditions, values };
};

// ─── Controllers ────────────────────────────────────────────────────────────

// POST /api/requests
const createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, priority } = req.body;
  const userId = req.user.id;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO requests (title, description, category, priority, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title.trim(), description.trim(), category.trim(), priority, STATUS.SUBMITTED, userId]
    );

    const newRequest = result.rows[0];

    // Log the creation
    await client.query(
      `INSERT INTO request_logs (request_id, old_status, new_status, changed_by, role, comment)
       VALUES ($1, NULL, $2, $3, $4, $5)`,
      [newRequest.id, STATUS.SUBMITTED, userId, req.user.role, 'Request created']
    );

    await client.query('COMMIT');

    res.status(201).json({ request: newRequest });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  } finally {
    client.release();
  }
};

// GET /api/requests/mine  (user's own requests)
const getMyRequests = async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const { conditions, values } = buildFilters(req.query, 2);
  conditions.unshift(`r.user_id = $1`);
  const allValues = [userId, ...values];

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  try {
    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT r.*, u.name AS requester_name
         FROM requests r
         JOIN users u ON r.user_id = u.id
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        allValues
      ),
      query(
        `SELECT COUNT(*) FROM requests r ${whereClause}`,
        allValues
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      requests: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get my requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// GET /api/requests  (manager sees submitted, admin sees all)
const getAllRequests = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const filterParams = { ...req.query };

  // Managers default to Submitted view
  if (req.user.role === 'manager' && !filterParams.status) {
    filterParams.status = STATUS.SUBMITTED;
  }

  const { conditions, values } = buildFilters(filterParams, 1);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT r.*, u.name AS requester_name
         FROM requests r
         JOIN users u ON r.user_id = u.id
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        values
      ),
      query(
        `SELECT COUNT(*) FROM requests r ${whereClause}`,
        values
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      requests: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// GET /api/requests/:id
const getRequestById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT r.*, u.name AS requester_name, u.email AS requester_email
       FROM requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Users can only see their own requests
    if (req.user.role === 'user' && request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Attach available transitions for the current user's role
    const availableTransitions = getAvailableTransitions(request.status, req.user.role);

    res.json({ request: { ...request, availableTransitions } });
  } catch (err) {
    console.error('Get request by id error:', err);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
};

// PATCH /api/requests/:id/status
const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status: newStatus, comment } = req.body;
  const { id: userId, role } = req.user;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lock the row for update
    const result = await client.query(
      'SELECT * FROM requests WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Users can only update their own requests
    if (role === 'user' && request.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate transition through the workflow engine
    const validation = validateTransition(request.status, newStatus, role);

    if (!validation.valid) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: validation.reason });
    }

    const oldStatus = request.status;

    // Update the request
    const updated = await client.query(
      `UPDATE requests SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );

    // Write to audit log
    await client.query(
      `INSERT INTO request_logs (request_id, old_status, new_status, changed_by, role, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, oldStatus, newStatus, userId, role, comment || null]
    );

    await client.query('COMMIT');

    res.json({ request: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  } finally {
    client.release();
  }
};

// GET /api/requests/:id/logs
const getRequestLogs = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify the request exists and the user has access
    const reqResult = await query('SELECT * FROM requests WHERE id = $1', [id]);

    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = reqResult.rows[0];

    if (req.user.role === 'user' && request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await query(
      `SELECT l.*, u.name AS changed_by_name
       FROM request_logs l
       JOIN users u ON l.changed_by = u.id
       WHERE l.request_id = $1
       ORDER BY l.created_at ASC`,
      [id]
    );

    res.json({ logs: logs.rows });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// GET /api/requests/stats  (for dashboard cards)
const getStats = async (req, res) => {
  try {
    let statsQuery;
    let params = [];

    if (req.user.role === 'user') {
      statsQuery = `
        SELECT status, COUNT(*) AS count
        FROM requests
        WHERE user_id = $1
        GROUP BY status
      `;
      params = [req.user.id];
    } else {
      statsQuery = `
        SELECT status, COUNT(*) AS count
        FROM requests
        GROUP BY status
      `;
    }

    const result = await query(statsQuery, params);

    const stats = {
      Submitted: 0,
      Approved: 0,
      Rejected: 0,
      'Needs Clarification': 0,
      Closed: 0,
      Reopened: 0,
      total: 0,
    };

    result.rows.forEach((row) => {
      if (stats.hasOwnProperty(row.status)) {
        stats[row.status] = parseInt(row.count);
      }
      stats.total += parseInt(row.count);
    });

    res.json({ stats });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  updateStatus,
  getRequestLogs,
  getStats,
};
