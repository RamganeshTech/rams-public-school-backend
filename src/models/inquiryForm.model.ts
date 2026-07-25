import { Schema, model, Document } from 'mongoose';

export interface IInquiry extends Document {
  name: string;
  mobile: string;
  email?: string;
  grade: string | null;
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
    },
    grade: {
      type: String,
      default: null
    },
    inquiryType: {
      type: String,
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