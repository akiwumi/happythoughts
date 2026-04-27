import { Schema, model, Document, Types } from "mongoose";

export interface MessageDoc extends Document {
    text: string;
    author: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<MessageDoc>(
    {
        text: { type: String, required: true, trim: true, maxlength: 500 },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export default model<MessageDoc>("Message", messageSchema);
