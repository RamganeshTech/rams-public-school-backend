import { Schema, model, Document } from 'mongoose';

export interface IInquiry extends Document {
  name: string;
  mobile: string;
  email?: string;
  grade: string;
  inquiryType: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
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
      trim: true,
      lowercase: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    inquiryType: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

// Indexes
inquirySchema.index({ name: 1 });
inquirySchema.index({ mobile: 1 });
inquirySchema.index({ createdAt: -1 });

export const InquiryFormModel = model<IInquiry>('InquiryFormModel', inquirySchema);