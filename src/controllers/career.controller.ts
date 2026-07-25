import { Request, Response } from 'express';
import { CareerModel } from '../models/career.model';
import { uploadFileToS3 } from '../utils/s3Upload';
import { RoleBasedRequest } from '../utils/types';

// @route   POST /api/careers/apply
export const applyCareer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, mobile, email, position, qualification, experience, coverLetter } = req.body;

        if (!name || !mobile || !email || !position || !qualification || !experience) {
            res.status(400).json({
                ok: false,
                message: 'Name, mobile, email, position, qualification and experience are required',
            });
            return;
        }

        // Resume is currently required — flip this check later if it becomes optional
        const file = req.file;
        // if (!file) {
        //     res.status(400).json({
        //         ok: false,
        //         message: 'Resume file is required',
        //     });
        //     return;
        // }

        let resumeUrl = null
        if (file) {

            resumeUrl = await uploadFileToS3(file);
        }


        const career = await CareerModel.create({
            name,
            mobile,
            email,
            position,
            qualification,
            experience,
            coverLetter,
            resumeUrl,
        });

        res.status(201).json({
            ok: true,
            message: 'Application submitted successfully',
            data: career,
        });
    } catch (error) {
        console.error('Error submitting career application:', error);
        res.status(500).json({
            ok: false,
            message: 'Something went wrong while submitting application',
        });
    }
};

// @route   GET /api/careers
export const getCareers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, fromDate, toDate } = req.query;

        // 1. Build dynamic filter object
        let filter: any = {};

        // 2. Search filter (matches applicant name, email, phone, or position flexibly)
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }

        // 3. Date range filter based on createdAt
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) {
                filter.createdAt.$gte = new Date(fromDate as string);
            }
            if (toDate) {
                const endD = new Date(toDate as string);
                endD.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endD;
            }
        }

        // 4. Run query with filters applied
        const careers = await CareerModel.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            count: careers.length,
            data: careers,
        });
    } catch (error) {
        console.error('Error fetching career applications:', error);
        res.status(500).json({
            ok: false,
            message: 'Something went wrong while fetching applications',
        });
    }
};



// Get Career Application by ID
export const getCareerById = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const career = await CareerModel.findById(id);

        if (!career) {
            return res.status(404).json({ ok: false, message: "Career application not found" });
        }

        return res.status(200).json({ ok: true, data: career });
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Server error", error: err?.message });
    }
};

// Delete Career Application by ID
export const deleteCareerById = async (req: RoleBasedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const career = await CareerModel.findByIdAndDelete(id);

        if (!career) {
            return res.status(404).json({ ok: false, message: "Career application not found" });
        }

        return res.status(200).json({ ok: true, message: "Career application deleted successfully" });
    } catch (err: any) {
        return res.status(500).json({ ok: false, message: "Server error", error: err?.message });
    }
};