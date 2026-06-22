/*
function getRelevantChunks(
  question,
  chunks
) {
  const lowerQuestion =
    question.toLowerCase();

  // For summary/explanation requests,
  // use the entire document
  if (
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("explain") ||
    lowerQuestion.includes("report")
  ) {
    return chunks;
  }

  const keywords =
    lowerQuestion.split(" ");

  return chunks.filter((chunk) => {
    const text =
      chunk.toLowerCase();

    return keywords.some((word) =>
      text.includes(word)
    );
  });
}

module.exports =
  getRelevantChunks;
  */
 const { getEmbedding } =
  require("./localEmbedding");

const cosineSimilarity =
  require("./similarity");

async function getRelevantChunks(
  question,
  chunks,
  vectors
) {
  const lowerQuestion =
    question.toLowerCase();

  // Summary requests → use whole document
  if (
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("explain") ||
    lowerQuestion.includes("report")
  ) {
    return chunks;
  }

  const questionVector =
    await getEmbedding(question);

  const scores =
    vectors.map((vector, index) => ({
      chunk: chunks[index],
      score: cosineSimilarity(
        questionVector,
        vector
      ),
    }));

  scores.sort(
    (a, b) => b.score - a.score
  );

  console.log("TOP MATCHES");

  scores
    .slice(0, 3)
    .forEach((item, index) => {
      console.log(
        `${index + 1}. Score: ${item.score}`
      );

      console.log(
        item.chunk.substring(0, 120)
      );

      console.log("----------");
    });

  return scores
    .slice(0, 3)
    .map((item) => item.chunk);
}

module.exports =
  getRelevantChunks;