import type { Request, Response } from "express";
import Thought from "../modals/Thought.js";
import type { AuthRequest } from "../utils/verifyToken.js";

// Create a new thought
export const createThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message } = req.body;
        
        if (!message || message.trim().length < 5 || message.trim().length > 140) {
            res.status(400).json({ 
                message: "Message must be between 5 and 140 characters" 
            });
            return;
        }

        const thought = new Thought({
            message: message.trim(),
            author: req.user!.userId
        });

        await thought.save();
        await thought.populate('author', 'name email');

        res.status(201).json({ 
            success: true, 
            thought 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all thoughts
export const getThoughts = async (req: Request, res: Response): Promise<void> => {
    try {
        const thoughts = await Thought.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            thoughts 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Edit a thought (PUT /thoughts/:id)
export const editThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        if (!message || message.trim().length < 5 || message.trim().length > 140) {
            res.status(400).json({ 
                message: "Message must be between 5 and 140 characters" 
            });
            return;
        }

        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        // Check if the user is the author of the thought
        if (thought.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized to edit this thought" });
            return;
        }

        // Update the thought
        thought.message = message.trim();
        thought.updatedAt = new Date();
        
        await thought.save();
        await thought.populate('author', 'name email');

        res.json({ 
            success: true, 
            thought 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a thought (DELETE /thoughts/:id)
export const deleteThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        // Check if the user is the author of the thought
        if (thought.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized to delete this thought" });
            return;
        }

        await Thought.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: "Thought deleted successfully" 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

// Like a thought (POST /thoughts/:id/like)
export const likeThought = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        thought.likes += 1;
        await thought.save();

        res.json({ 
            success: true, 
            likes: thought.likes 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
