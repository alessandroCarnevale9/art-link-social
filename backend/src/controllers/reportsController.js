const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Report = require("../models/ReportModel");
const Artwork = require("../models/ArtworkModel");
const Comment = require("../models/CommentModel");
const { buildPagination } = require("../utils/queryHelpers");

/**
 * POST /api/reports
 * Create a new report for an artwork or comment
 */
const createReport = asyncHandler(async (req, res) => {
  const reporterId = req.userId;
  const { targetType, targetId, reasonType, otherReason } = req.body;

  if (!["Artwork", "Comment"].includes(targetType)) {
    throw new ApiError(
      400,
      "Invalid targetType. Must be 'Artwork' or 'Comment'."
    );
  }
  if (!targetId) throw new ApiError(400, "targetId is required.");
  if (
    ![
      "spam",
      "inappropriate_content",
      "privacy_violation",
      "intellectual_property",
      "other",
    ].includes(reasonType)
  ) {
    throw new ApiError(400, "Invalid reasonType.");
  }

  // Verifica che il target esista
  const exists =
    targetType === "Artwork"
      ? await Artwork.exists({ _id: targetId })
      : await Comment.exists({ _id: targetId });
  if (!exists) {
    throw new ApiError(404, `${targetType} not found.`);
  }

  const report = await Report.create({
    reporterId,
    targetType,
    targetId,
    reasonType,
    otherReason,
  });
  res.status(201).json(report);
});

/**
 * GET /api/reports
 * Admin only: list reports, optional status filter, paginated
 */
const getReports = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") throw new ApiError(403, "Forbidden");

  const { page, limit, skip } = buildPagination(req);

  const filter = {};
  if (req.query.status) {
    const allowed = ["Open", "Resolved", "Ignored"];
    if (!allowed.includes(req.query.status)) {
      throw new ApiError(400, "Invalid status filter.");
    }
    filter.status = req.query.status;
  }

  const [total, data] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .populate("reporterId", "firstName lastName email")
      .populate("handledBy", "firstName lastName email")
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({ total, page, limit, data });
});

/**
 * PATCH /api/reports/:id
 * Admin only: update status and add handling info
 */
const handleReport = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") throw new ApiError(403, "Forbidden");

  const { id } = req.params;
  const { status, otherReason } = req.body;
  const allowed = ["Open", "Resolved", "Ignored"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, "Invalid status value.");
  }

  const update = { status, handledBy: req.userId, handledAt: new Date() };
  if (otherReason !== undefined) update.otherReason = otherReason;

  const report = await Report.findByIdAndUpdate(id, update, { new: true })
    .populate("reporterId", "firstName lastName email")
    .populate("handledBy", "firstName lastName email")
    .lean();
  if (!report) throw new ApiError(404, "Report not found.");

  res.json(report);
});

module.exports = {
  createReport,
  getReports,
  handleReport,
};
