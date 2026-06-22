require("dotenv").config();

const chunkText = require("./utils/chunkText");
const groq = require("./utils/groq");
const getRelevantChunks = require("./utils/retrieval");

const {
  storedChunks,
  storedVectors,
} = require("./vectorStore");

const { getEmbedding } =
  require("./utils/localEmbedding");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
const app = express();

app.use(cors());
app.use(express.json());

//const PORT = 5000;
const PORT = process.env.PORT || 5000;
// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

// Home Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});


// ===============================
// UPLOAD PDF ROUTE (UPDATED)
// ===============================
app.post(
  "/upload",
  upload.single("pdf"),
  async (req, res) => {
    try {
      const dataBuffer =
        fs.readFileSync(req.file.path);

      const data =
        await pdf(dataBuffer);

      const chunks =
        chunkText(data.text);

      // reset storage
      storedChunks.length = 0;
      storedVectors.length = 0;

      // store chunks + embeddings
      for (const chunk of chunks) {
        const vector =
          await getEmbedding(chunk);

        storedChunks.push(chunk);
        storedVectors.push(vector);
      }
      console.log("UPLOAD COMPLETE");
console.log("Chunks:", storedChunks.length);
console.log("Vectors:", storedVectors.length);
console.log("Sample vector:", storedVectors[0]);

      res.json({
        message: "PDF processed with embeddings",
        totalChunks: chunks.length,
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        error: "PDF Parsing Failed",
      });
    }
  }
);


// ===============================
// ASK QUESTION ROUTE (GROQ)
// ===============================
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }
    if (storedChunks.length === 0) {
  return res.status(400).json({
    error: "Please upload a PDF first",
  });
}
    // get relevant chunks using embeddings
    const relevantChunks =
      await getRelevantChunks(
        question,
        storedChunks,
        storedVectors
      );
      console.log("Question:", question);
console.log("Relevant chunks found:", relevantChunks.length);
console.log("First relevant chunk:", relevantChunks[0]);
      
    const context =
      relevantChunks.length > 0
        ? relevantChunks.join("\n")
        : storedChunks.join("\n");

    const prompt = `
Context:
${context}

Question:
${question}

Answer ONLY from the provided context.
If the answer is not available, say:
"I could not find that information in the PDF."
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });

    const answer =
      completion.choices[0].message.content;

    res.json({ answer });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
/*require("dotenv").config();

const chunkText = require("./utils/chunkText");
const groq = require("./utils/groq");
const getRelevantChunks =
  require("./utils/retrieval");
const {
  storedChunks,
} = require("./vectorStore");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

// Home Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Upload PDF Route
app.post(
  "/upload",
  upload.single("pdf"),
  async (req, res) => {
    try {
      const dataBuffer =
        fs.readFileSync(req.file.path);

      const data =
        await pdf(dataBuffer);

      const chunks =
        chunkText(data.text);

      storedChunks.length = 0;
      storedChunks.push(...chunks);

      res.json({
        message: "PDF Uploaded Successfully",
        totalChunks: chunks.length,
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        error: "PDF Parsing Failed",
      });
    }
  }
);

// Ask Question Route
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    
const relevantChunks =
  getRelevantChunks(
    question,
    storedChunks
  );

const context =
  relevantChunks.length > 0
    ? relevantChunks.join("\n")
    : storedChunks.join("\n");
    const prompt = `
Context:
${context}

Question:
${question}

Answer ONLY from the provided context.
If the answer is not available in the context, say:
"I could not find that information in the PDF."
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
      });

    const answer =
      completion.choices[0].message.content;

    res.json({
      answer,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});*/