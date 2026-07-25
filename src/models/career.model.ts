import { Schema, model, Document } from 'mongoose';



interface IResumeFile {
    url: string;
    key: string;
    type: 'image' | 'pdf' | 'other';
    originalName: string;
    uploadedAt: Date;
}


export interface ICareer extends Document {
    name: string;
    mobile: string;
    email: string;
    position: string;
    qualification: string;
    experience: string;
    coverLetter: string;
    resumeUrl: IResumeFile | null;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}


const resumeFileSchema = new Schema<IResumeFile>(
    {
        url: { type: String, required: true },
        key: { type: String, required: true },
        type: { type: String, enum: ['image', 'pdf', 'other'], required: true },
        originalName: { type: String, required: true },
        uploadedAt: { type: Date, default: () => new Date() },
    },
    { _id: false } // don't need a separate _id for this sub-document
);

const careerSchema = new Schema<ICareer>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        position: {
            type: String,
            required: true,
            trim: true,
        },
        qualification: {
            type: String,
            required: true,
            trim: true,
        },
        experience: {
            type: String,
            required: true,
            trim: true,
        },
        coverLetter: {
            type: String,
            default: '',
        },
        resumeUrl: { type: resumeFileSchema, default: null }, // 👈 explicit sub-schema reference
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// Indexes
careerSchema.index({ name: 1 });
careerSchema.index({ email: 1 });
careerSchema.index({ position: 1 });
careerSchema.index({ createdAt: -1 });

export const CareerModel = model<ICareer>('CareerModel', careerSchema);