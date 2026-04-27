import { Schema, model } from "mongoose";
import type { ThoughtProps } from "../types.js";

const thoughtSchema = new Schema<ThoughtProps>({
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 140
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default model<ThoughtProps>("Thought", thoughtSchema);
