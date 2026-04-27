import User from "./modals/User.js";
import bcrypt from "bcryptjs";

export const seedDefaultUser = async (): Promise<void> => {
  try {
    // Check if default user already exists
    const existingUser = await User.findOne({ email: "admin@happythoughts.com" });
    
    if (!existingUser) {
      // Create default user
      const defaultUser = new User({
        name: "Happy Admin",
        email: "admin@happythoughts.com",
        password: "happy123"
      });

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      defaultUser.password = await bcrypt.hash(defaultUser.password, salt);
      
      await defaultUser.save();
      console.log("✅ Default user created successfully!");
      console.log("📧 Email: admin@happythoughts.com");
      console.log("🔑 Password: happy123");
    } else {
      console.log("ℹ️ Default user already exists");
    }
  } catch (error) {
    console.error("❌ Error seeding default user:", error);
  }
};
