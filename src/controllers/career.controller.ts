import { Request, Response } from 'express';
import { CareerModel } from '../models/career.model';
import { uploadFileToS3 } from '../utils/s3Upload';

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
        if (!file) {
            res.status(400).json({
                ok: false,
                message: 'Resume file is required',
            });
            return;
        }

        const resumeUrl = await uploadFileToS3(file);


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
        const careers = await CareerModel.find().sort({ createdAt: -1 });

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