import { Request, Response } from 'express';
import { InquiryFormModel } from '../models/inquiryForm.model';
import { RoleBasedRequest } from '../utils/types';

// @route   POST /api/inquiries
// @desc    Create a new inquiry
export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, inquiryType, message } = req.body;

    // Basic validation
    if (!name || !mobile || !inquiryType || !message) {
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
      grade: null,
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

    const { search, fromDate, toDate } = req.query;

    // 1. Build dynamic filter object
    let filter: any = {};

    // 2. Search filter (matches name, phone, or grade flexibly)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Date range filter based on createdAt
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        // Start of the given fromDate
        filter.createdAt.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        // End of the given toDate (set time to end of day)
        const endD = new Date(toDate as string);
        endD.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endD;
      }
    }

    // 4. Run query with filters applied
    const inquiries = await InquiryFormModel.find(filter).sort({ createdAt: -1 });

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

// Get Inquiry by ID
export const getInquiryById = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const inquiry = await InquiryFormModel.findById(id);

        if (!inquiry) {
            return res.status(404).json({ ok: false, message: "Inquiry not found" });
        }

        return res.status(200).json({ ok: true, data: inquiry });
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Server error", error: err?.message });
    }
};

// Delete Inquiry by ID
export const deleteInquiryById = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const inquiry = await InquiryFormModel.findByIdAndDelete(id);

        if (!inquiry) {
            return res.status(404).json({ ok: false, message: "Inquiry not found" });
        }

        return res.status(200).json({ ok: true, message: "Inquiry deleted successfully" });
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Server error", error: err?.message });
    }
};