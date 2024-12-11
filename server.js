import express from "express";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config({path:".env.local"})
import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = 3000;

//get Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//save uploaded imgs in the upload folder
const upload = multer({ dest: "uploads/" });


//convert file to right format that gemini could take
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType,
        },
    };
}
//identify mushroom function
async function identifyMushrooms(file) {
  try {
    const prompt = `
    Please identify the mushroom in the picture and provide the details in strict JSON format. Include the following fields:
    - "name": Name of the mushroom.
    - "basic_info": A brief description of the mushroom, including its appearance, habitat, edibility, and any warnings.
    - "recipe": An object containing:
      - "name": The name of a recipe using this mushroom.
      - "ingredients": An array of ingredients needed for the recipe.
      - "instructions": An array of step-by-step instructions to prepare the recipe.
    
    ### Example JSON Output:
    {
      "name": "Chanterelle",
      "basic_info": "Chanterelles are highly prized edible mushrooms known for their distinctive funnel shape, vibrant yellow-orange color, and fruity aroma. They are found in many parts of the world, typically growing in coniferous or mixed forests. They are prized for their peppery, slightly fruity flavor. It is crucial to only forage mushrooms if you are 100% certain of their identification; misidentification can be dangerous. There are poisonous lookalikes.",
      "recipe": {
        "name": "Sautéed Chanterelles",
        "ingredients": [
          "1 pound fresh chanterelles",
          "2 tablespoons butter",
          "2 cloves garlic, minced",
          "1 sprig fresh thyme, leaves removed",
          "Salt and freshly ground black pepper to taste",
          "Optional: 1 tablespoon dry white wine or chicken broth"
        ],
        "instructions": [
          "Clean the chanterelles gently with a damp cloth or brush. Avoid washing them thoroughly to prevent water absorption.",
          "Melt the butter in a large skillet over medium heat. Add the chanterelles and cook, stirring occasionally, until they release their moisture and begin to brown, about 5-7 minutes.",
          "Add minced garlic and thyme leaves to the skillet. Cook for another minute until fragrant.",
          "Optionally, deglaze with white wine or chicken broth, scraping up any browned bits from the skillet. Simmer for 1-2 minutes.",
          "Season with salt and pepper to taste.",
          "Serve immediately as a side dish, or over pasta, polenta, or grilled chicken or fish."
        ]
      }
    }
    
    ### Your Turn:
    Provide the response in JSON format. No additional text or comments are needed.
    `;

      const imagePart = fileToGenerativePart(file.path, file.mimetype);
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
      console.log(response);
  } catch (error) {
      console.error("Error generating mushroom identification:", error);
      throw new Error("Failed to process mushroom identification.");
  }
}

// API endpoint for identifying mushrooms from uploaded pictures.
app.post("/identify", upload.single("uploadFiles"), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ error: "No file uploaded." });
      }
      const result = await identifyMushrooms(req.file);

      // delete uploaded file
      fs.unlinkSync(req.file.path);
      res.json({ output: result });
  } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: error.message });
  }
});

// get files from frontend
app.use(express.static("public"));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});