import { Document, Types } from "mongoose";

export interface UserProps extends Document {
    name?: string;
    email: string;
    password: string;
    createdAt: Date;
    avatar?: string;
}

export interface ThoughtProps extends Document {
    _id: Types.ObjectId;
    message: string;
    author: Types.ObjectId;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationProps extends Document {
    _id: Types.ObjectId;
    type: "direct" | "group";
    name?: string;
    participants: Types.ObjectId[];
    lastMessage: Types.ObjectId;
    createdBy: Types.ObjectId;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}
