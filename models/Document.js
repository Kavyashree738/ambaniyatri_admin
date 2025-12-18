const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    fullName: String,
    email: String,

    files: {
      driver_photo: String,
      aadhar_card: String,
      driving_license: String,
      vehicle_registration: String,
      pan_card: String,
      insurance: String,
      bank_passbook: String
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
