/**
 * Generate quick statements for "inne niż" (P1889: other then).
 */
const items = ["Q30049642", "Q30049645", "Q30049646"];

for (let i = 0; i < items.length; i++) {
  for (let j = 0; j < items.length; j++) {
    if (i !== j) {
      console.log(`${items[i]}|P1889|${items[j]}`);
    }
  }
}
