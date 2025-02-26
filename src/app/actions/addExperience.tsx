"use server";
import { currentUser } from "@clerk/nextjs/server";
import { findUserbyId } from "@/data/FindUser";
import { db } from "@/lib/db";
import * as z from "zod";

const ExperienceSchema = z.object({
    company: z.string().min(1, "Company name is required"),
    role: z.string().min(1, "Role is required"),
    duration: z.string().min(1, "Duration is required"),
    description: z.string().optional()
  })


// Schema for the entire form
const SettingsSchema = z.object({
  experiences: z.array(ExperienceSchema)
});

export const addExperiences = async (values: z.infer<typeof SettingsSchema>) => {
  try {
    // Validate input data against the schema
    const validatedData = SettingsSchema.parse(values);

    // Get the current user
    const user = await currentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get the user record from the database
    const dbUser = await findUserbyId(user.id);
    if (!dbUser) {
      return { error: "User not found" };
    }



    
    const experiences = await db.$transaction(
      validatedData.experiences.map((experience) => 
        db.experience.create({
          data: {
            CompanyName: experience.company,
            Duration: experience.duration,
            Role: experience.role,
            Description: experience.description || "",
            userId: dbUser.id 
          }
        })
      )
    );

    return { success: "Experiences updated successfully" };
  } catch (error) {
    console.error("Error updating experiences:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid form data. Please check your input." };
    }
    return { error: "Something went wrong! Please try again." };
  }
};



