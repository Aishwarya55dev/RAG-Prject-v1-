/*function chunkText(text, chunkSize = 500) {
  const chunks = [];

  for (
    let i = 0;
    i < text.length;
    i += chunkSize
  ) {
    chunks.push(
      text.slice(i, i + chunkSize)
    );
  }

  return chunks;
}

module.exports = chunkText;
*/
function chunkText(
  text,
  chunkSize = 300,
  overlap = 50
) {
  const chunks = [];

  for (
    let i = 0;
    i < text.length;
    i += chunkSize - overlap
  ) {
    chunks.push(
      text.slice(i, i + chunkSize)
    );
  }

  return chunks;
}

module.exports = chunkText;