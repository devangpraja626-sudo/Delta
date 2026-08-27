const Connection = require("../models/Connection");

// @route POST /api/connections/request
// body: { recipientId, message? }
exports.sendRequest = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: "recipientId is required" });
    }
    if (recipientId === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "You cannot connect with yourself" });
    }

    const connection = await Connection.create({
      requester: req.user.id,
      recipient: recipientId,
      message,
    });

    res.status(201).json({ success: true, connection });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Connection request already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/connections/:id/respond
// body: { status: "accepted" | "rejected" }
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be accepted or rejected" });
    }

    const connection = await Connection.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { status },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection request not found" });
    }

    res.status(200).json({ success: true, connection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/connections/mine  - all connections involving the current user
exports.getMyConnections = async (req, res) => {
  const connections = await Connection.find({
    $or: [{ requester: req.user.id }, { recipient: req.user.id }],
  })
    .populate("requester", "email role")
    .populate("recipient", "email role")
    .sort("-createdAt");

  res.status(200).json({ success: true, count: connections.length, connections });
};

// @route GET /api/connections/pending  - incoming requests awaiting response
exports.getPendingRequests = async (req, res) => {
  const pending = await Connection.find({ recipient: req.user.id, status: "pending" })
    .populate("requester", "email role")
    .sort("-createdAt");

  res.status(200).json({ success: true, count: pending.length, pending });
};