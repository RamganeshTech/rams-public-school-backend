import { Request, Response } from 'express';
import { InquiryFormModel } from '../models/inquiryForm.model';

// @route   POST /api/inquiries
// @desc    Create a new inquiry
export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, grade, inquiryType, message } = req.body;

    // Basic validation
    if (!name || !mobile || !grade || !inquiryType || !message) {
      res.status(400).json({
        ok: false,
        message: 'Name, mobile, grade, inquiryType and message are required',
      });
      return;
    }

    const inquiry = await InquiryFormModel.create({
      name,
      mobile,
      email,
      grade,
      inquiryType,
      message,
    });

    res.status(201).json({
      ok: true,
      message: 'Inquiry submitted successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({
      ok: false,
      message: 'Something went wrong while submitting inquiry',
    });
  }
};

// @route   GET /api/inquiries
// @desc    Get all inquiries (for admin use)
export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const inquiries = await InquiryFormModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({
      ok: false,
      message: 'Something went wrong while fetching inquiries',
    });
  }
};